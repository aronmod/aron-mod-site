CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id text NOT NULL,
  plan text NOT NULL CHECK (plan IN ('base','plus')),
  key_hash text NOT NULL UNIQUE,
  key_last4 text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','expired','revoked')),
  expires_at timestamptz NOT NULL,
  hwid_hash text,
  first_bound_at timestamptz,
  last_validated_at timestamptz,
  last_hwid_reset_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_licenses_discord_plan_status ON public.licenses (discord_user_id, plan, status);

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id text NOT NULL,
  discord_ticket_channel_id text,
  plan text NOT NULL CHECK (plan IN ('base','plus')),
  days integer NOT NULL CHECK (days IN (15,30)),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','awaiting_payment','paid','cancelled','refunded','reversed')),
  checkout_token_hash text NOT NULL UNIQUE,
  checkout_expires_at timestamptz NOT NULL,
  paypal_order_id text UNIQUE,
  paypal_capture_id text UNIQUE,
  license_id uuid REFERENCES public.licenses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchase_orders_discord ON public.purchase_orders (discord_user_id, status);

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  paypal_capture_id text,
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  payload_minimal jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.license_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES public.licenses(id) ON DELETE CASCADE,
  action text NOT NULL,
  source text NOT NULL,
  metadata_minimal jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_license_audit_license ON public.license_audit (license_id, created_at DESC);

GRANT ALL ON public.licenses TO service_role;
GRANT ALL ON public.purchase_orders TO service_role;
GRANT ALL ON public.payment_events TO service_role;
GRANT ALL ON public.license_audit TO service_role;

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_audit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_licenses_updated BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_purchase_orders_updated BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.finalize_paid_order(
  _order_id uuid,
  _capture_id text,
  _new_key_hash text,
  _new_key_last4 text,
  _source text
)
RETURNS TABLE (result text, license_id uuid, expires_at timestamptz, is_new_license boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.finalize_paid_order(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(uuid, text, text, text, text) TO service_role;