ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS risk_status text,
  ADD COLUMN IF NOT EXISTS risk_reason text,
  ADD COLUMN IF NOT EXISTS risk_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_approved_by text,
  ADD COLUMN IF NOT EXISTS review_approved_at timestamptz;

CREATE OR REPLACE FUNCTION public.finalize_paid_order_reviewed(
  _order_id uuid,
  _capture_id text,
  _source text,
  _risk_status text,
  _risk_reason text,
  _needs_review boolean
)
RETURNS TABLE(result text, plan text, days integer, amount_cents integer, ticket_channel_id text, discord_user_id text, fulfillment_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o public.purchase_orders%ROWTYPE;
  target_fulfillment text;
BEGIN
  SELECT * INTO o FROM public.purchase_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'order_not_found'::text, NULL::text, NULL::integer, NULL::integer, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF o.status = 'paid' THEN
    RETURN QUERY SELECT 'already_processed'::text, o.plan, o.days, o.amount_cents, o.discord_ticket_channel_id, o.discord_user_id, o.fulfillment_status;
    RETURN;
  END IF;

  target_fulfillment := CASE WHEN _needs_review THEN 'review_required' ELSE 'ready' END;

  UPDATE public.purchase_orders
    SET status = 'paid',
        paid_at = now(),
        paypal_capture_id = COALESCE(paypal_capture_id, _capture_id),
        fulfillment_status = COALESCE(fulfillment_status, target_fulfillment),
        risk_status = COALESCE(_risk_status, 'UNKNOWN'),
        risk_reason = _risk_reason,
        risk_checked_at = now()
    WHERE id = o.id;

  INSERT INTO public.license_audit (license_id, action, source, metadata_minimal)
  VALUES (NULL, 'order_paid', _source,
          jsonb_build_object('order_id', o.id, 'plan', o.plan, 'days', o.days,
                             'risk_status', COALESCE(_risk_status, 'UNKNOWN'),
                             'risk_reason', _risk_reason,
                             'fulfillment', target_fulfillment));

  RETURN QUERY SELECT 'paid'::text, o.plan, o.days, o.amount_cents, o.discord_ticket_channel_id, o.discord_user_id, target_fulfillment;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_order_delivery(_order_id uuid, _staff_id text)
RETURNS TABLE(result text, ticket_channel_id text, discord_user_id text, plan text, days integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o public.purchase_orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.purchase_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'order_not_found'::text, NULL::text, NULL::text, NULL::text, NULL::integer;
    RETURN;
  END IF;

  IF o.status <> 'paid' THEN
    RETURN QUERY SELECT 'order_not_paid'::text, o.discord_ticket_channel_id, o.discord_user_id, o.plan, o.days;
    RETURN;
  END IF;

  IF o.fulfillment_status IS DISTINCT FROM 'review_required' THEN
    RETURN QUERY SELECT 'already_approved'::text, o.discord_ticket_channel_id, o.discord_user_id, o.plan, o.days;
    RETURN;
  END IF;

  UPDATE public.purchase_orders
    SET fulfillment_status = 'ready',
        review_approved_by = _staff_id,
        review_approved_at = now()
    WHERE id = o.id;

  INSERT INTO public.license_audit (license_id, action, source, metadata_minimal)
  VALUES (NULL, 'delivery_review_approved', 'discord_staff',
          jsonb_build_object('order_id', o.id, 'staff_id', _staff_id, 'risk_status', o.risk_status));

  RETURN QUERY SELECT 'approved'::text, o.discord_ticket_channel_id, o.discord_user_id, o.plan, o.days;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_keyauth_key(_order_id uuid, _assigned_by text, _key_hash text, _key_last4 text, _ciphertext text, _iv text)
RETURNS TABLE(result text, assignment_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o public.purchase_orders%ROWTYPE;
  a public.keyauth_assignments%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.purchase_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'order_not_found'::text, NULL::text;
    RETURN;
  END IF;

  IF o.status <> 'paid' THEN
    RETURN QUERY SELECT 'order_not_paid'::text, NULL::text;
    RETURN;
  END IF;

  IF o.fulfillment_status = 'review_required' THEN
    RETURN QUERY SELECT 'review_required'::text, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO a FROM public.keyauth_assignments WHERE purchase_order_id = _order_id FOR UPDATE;
  IF FOUND THEN
    IF a.status = 'delivered' THEN
      RETURN QUERY SELECT 'already_delivered'::text, a.status;
      RETURN;
    END IF;
    RETURN QUERY SELECT 'pending_exists'::text, a.status;
    RETURN;
  END IF;

  INSERT INTO public.keyauth_assignments
    (purchase_order_id, key_hash, key_last4, assigned_by_discord_id, status)
  VALUES (_order_id, _key_hash, _key_last4, _assigned_by, 'pending');

  INSERT INTO public.license_deliveries
    (purchase_order_id, license_id, discord_ticket_channel_id, ciphertext, iv, status)
  VALUES (_order_id, NULL, o.discord_ticket_channel_id, _ciphertext, _iv, 'pending')
  ON CONFLICT (purchase_order_id) DO UPDATE
    SET ciphertext = EXCLUDED.ciphertext,
        iv = EXCLUDED.iv,
        status = 'pending',
        discord_ticket_channel_id = EXCLUDED.discord_ticket_channel_id;

  INSERT INTO public.license_audit (license_id, action, source, metadata_minimal)
  VALUES (NULL, 'keyauth_key_assigned', 'discord_staff',
          jsonb_build_object('order_id', _order_id, 'last4', _key_last4, 'staff_id', _assigned_by));

  RETURN QUERY SELECT 'assigned'::text, 'pending'::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_paid_order_reviewed(uuid, text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_order_delivery(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order_reviewed(uuid, text, text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_order_delivery(uuid, text) TO service_role;