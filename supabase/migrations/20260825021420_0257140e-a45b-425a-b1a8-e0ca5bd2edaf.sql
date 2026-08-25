ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS fulfillment_status text;

DO $$ BEGIN
  ALTER TABLE public.purchase_orders
    ADD CONSTRAINT purchase_orders_fulfillment_status_check
    CHECK (fulfillment_status IS NULL OR fulfillment_status IN ('pending_key','delivered','revoked'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.keyauth_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL UNIQUE REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_last4 text NOT NULL,
  assigned_by_discord_id text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','revoked'))
);

GRANT ALL ON public.keyauth_assignments TO service_role;
ALTER TABLE public.keyauth_assignments ENABLE ROW LEVEL SECURITY;
-- deny-by-default: no policies, only the service role reaches this table.

CREATE OR REPLACE FUNCTION public.finalize_paid_order_manual(
  _order_id uuid,
  _capture_id text,
  _source text
)
RETURNS TABLE(result text, plan text, days integer, amount_cents integer, ticket_channel_id text, discord_user_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  o public.purchase_orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.purchase_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'order_not_found'::text, NULL::text, NULL::integer, NULL::integer, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF o.status = 'paid' THEN
    RETURN QUERY SELECT 'already_processed'::text, o.plan, o.days, o.amount_cents, o.discord_ticket_channel_id, o.discord_user_id;
    RETURN;
  END IF;

  UPDATE public.purchase_orders
    SET status = 'paid',
        paid_at = now(),
        paypal_capture_id = COALESCE(paypal_capture_id, _capture_id),
        fulfillment_status = COALESCE(fulfillment_status, 'pending_key')
    WHERE id = o.id;

  INSERT INTO public.license_audit (license_id, action, source, metadata_minimal)
  VALUES (NULL, 'order_paid', _source,
          jsonb_build_object('order_id', o.id, 'plan', o.plan, 'days', o.days));

  RETURN QUERY SELECT 'paid'::text, o.plan, o.days, o.amount_cents, o.discord_ticket_channel_id, o.discord_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_keyauth_key(
  _order_id uuid,
  _assigned_by text,
  _key_hash text,
  _key_last4 text,
  _ciphertext text,
  _iv text
)
RETURNS TABLE(result text, assignment_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;