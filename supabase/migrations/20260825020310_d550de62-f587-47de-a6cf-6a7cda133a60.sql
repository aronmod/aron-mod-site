-- 1) payment_events retry/claim support
ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error_code text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text;

-- 2) Encrypted license key delivery outbox
CREATE TABLE IF NOT EXISTS public.license_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL UNIQUE REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  license_id uuid REFERENCES public.licenses(id) ON DELETE SET NULL,
  discord_ticket_channel_id text,
  ciphertext text,
  iv text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered')),
  attempts integer NOT NULL DEFAULT 0,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

GRANT ALL ON public.license_deliveries TO service_role;
ALTER TABLE public.license_deliveries ENABLE ROW LEVEL SECURITY;
-- deny-by-default: no policies, only the service role reaches this table

CREATE INDEX IF NOT EXISTS idx_license_deliveries_pending
  ON public.license_deliveries (status) WHERE status = 'pending';

-- 3) Rate limiting buckets (keys are HMAC fingerprints, never raw IPs)
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  counter integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.rate_limit_buckets TO service_role;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bump_rate_limit(_key text, _limit integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cur public.rate_limit_buckets%ROWTYPE;
BEGIN
  INSERT INTO public.rate_limit_buckets (bucket_key, window_start, counter)
  VALUES (_key, now(), 1)
  ON CONFLICT (bucket_key) DO UPDATE
    SET counter = CASE
          WHEN public.rate_limit_buckets.window_start < now() - make_interval(secs => _window_seconds) THEN 1
          ELSE public.rate_limit_buckets.counter + 1
        END,
        window_start = CASE
          WHEN public.rate_limit_buckets.window_start < now() - make_interval(secs => _window_seconds) THEN now()
          ELSE public.rate_limit_buckets.window_start
        END
  RETURNING * INTO cur;
  RETURN cur.counter <= _limit;
END;
$$;
REVOKE ALL ON FUNCTION public.bump_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(text, integer, integer) TO service_role;

-- 4) Atomic license validation + first HWID bind
CREATE OR REPLACE FUNCTION public.validate_license_hwid(_key_hash text, _hwid_hash text)
RETURNS TABLE(result text, license_id uuid, plan text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lic public.licenses%ROWTYPE;
BEGIN
  SELECT * INTO lic FROM public.licenses WHERE key_hash = _key_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::timestamptz;
    RETURN;
  END IF;

  IF lic.status <> 'active' THEN
    RETURN QUERY SELECT 'invalid'::text, lic.id, NULL::text, NULL::timestamptz;
    RETURN;
  END IF;

  IF lic.expires_at <= now() THEN
    UPDATE public.licenses SET status = 'expired' WHERE id = lic.id;
    RETURN QUERY SELECT 'expired'::text, lic.id, NULL::text, NULL::timestamptz;
    RETURN;
  END IF;

  IF lic.hwid_hash IS NULL THEN
    UPDATE public.licenses
      SET hwid_hash = _hwid_hash, first_bound_at = now(), last_validated_at = now()
      WHERE id = lic.id;
    RETURN QUERY SELECT 'bound'::text, lic.id, lic.plan::text, lic.expires_at;
    RETURN;
  ELSIF lic.hwid_hash <> _hwid_hash THEN
    RETURN QUERY SELECT 'hwid_mismatch'::text, lic.id, NULL::text, NULL::timestamptz;
    RETURN;
  END IF;

  UPDATE public.licenses SET last_validated_at = now() WHERE id = lic.id;
  RETURN QUERY SELECT 'valid'::text, lic.id, lic.plan::text, lic.expires_at;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_license_hwid(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_license_hwid(text, text) TO service_role;

-- 5) finalize_paid_order now writes the encrypted delivery outbox in the same transaction
DROP FUNCTION IF EXISTS public.finalize_paid_order(uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.finalize_paid_order(
  _order_id uuid,
  _capture_id text,
  _new_key_hash text,
  _new_key_last4 text,
  _source text,
  _delivery_ciphertext text DEFAULT NULL,
  _delivery_iv text DEFAULT NULL
)
RETURNS TABLE(result text, license_id uuid, expires_at timestamptz, is_new_license boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  o public.purchase_orders%ROWTYPE;
  lic public.licenses%ROWTYPE;
  base_ts timestamptz;
  new_exp timestamptz;
  created_new boolean := false;
BEGIN
  SELECT * INTO o FROM public.purchase_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'order_not_found'::text, NULL::uuid, NULL::timestamptz, false;
    RETURN;
  END IF;

  IF o.status = 'paid' THEN
    SELECT * INTO lic FROM public.licenses WHERE id = o.license_id;
    RETURN QUERY SELECT 'already_processed'::text, o.license_id, lic.expires_at, false;
    RETURN;
  END IF;

  SELECT * INTO lic
  FROM public.licenses
  WHERE discord_user_id = o.discord_user_id
    AND plan = o.plan
    AND status IN ('active','suspended')
  ORDER BY expires_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    base_ts := GREATEST(lic.expires_at, now());
    new_exp := base_ts + (o.days || ' days')::interval;
    UPDATE public.licenses
      SET expires_at = new_exp, status = 'active'
      WHERE id = lic.id;
  ELSE
    created_new := true;
    new_exp := now() + (o.days || ' days')::interval;
    INSERT INTO public.licenses (discord_user_id, plan, key_hash, key_last4, status, expires_at)
    VALUES (o.discord_user_id, o.plan, _new_key_hash, _new_key_last4, 'active', new_exp)
    RETURNING * INTO lic;

    IF _delivery_ciphertext IS NOT NULL AND _delivery_iv IS NOT NULL THEN
      INSERT INTO public.license_deliveries
        (purchase_order_id, license_id, discord_ticket_channel_id, ciphertext, iv, status)
      VALUES (o.id, lic.id, o.discord_ticket_channel_id, _delivery_ciphertext, _delivery_iv, 'pending')
      ON CONFLICT (purchase_order_id) DO NOTHING;
    END IF;
  END IF;

  UPDATE public.purchase_orders
    SET status = 'paid',
        paid_at = now(),
        paypal_capture_id = COALESCE(paypal_capture_id, _capture_id),
        license_id = lic.id
    WHERE id = o.id;

  INSERT INTO public.license_audit (license_id, action, source, metadata_minimal)
  VALUES (lic.id, CASE WHEN created_new THEN 'license_created' ELSE 'license_extended' END, _source,
          jsonb_build_object('order_id', o.id, 'plan', o.plan, 'days', o.days));

  RETURN QUERY SELECT 'fulfilled'::text, lic.id, new_exp, created_new;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_paid_order(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(uuid, text, text, text, text, text, text) TO service_role;