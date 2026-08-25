import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client used exclusively by server-side purchase logic.
 * All purchase tables are RLS deny-by-default, so this is the only access path.
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("supabase_service_config_missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
