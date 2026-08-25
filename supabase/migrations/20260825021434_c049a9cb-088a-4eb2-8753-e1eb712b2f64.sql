REVOKE ALL ON FUNCTION public.finalize_paid_order_manual(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_keyauth_key(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order_manual(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_keyauth_key(uuid, text, text, text, text, text) TO service_role;