import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  license_key: z.string().min(8).max(128),
  hwid: z.string().min(8).max(256),
});

function deny(reason: string) {
  // Generic response: never reveals whether the key exists.
  return new Response(JSON.stringify({ valid: false, reason }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/license-validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof schema>;
        try {
          parsed = schema.parse(await request.json());
        } catch {
          return deny("invalid");
        }

        const { sha256Hex } = await import("@/lib/purchase/crypto.server");
        const { getServiceClient } = await import("@/lib/purchase/db.server");
        const supabase = getServiceClient();

        const keyHash = await sha256Hex(parsed.license_key.trim().toUpperCase());
        const hwidHash = await sha256Hex(parsed.hwid.trim());

        const { data: license } = await supabase
          .from("licenses")
          .select("id, plan, status, expires_at, hwid_hash")
          .eq("key_hash", keyHash)
          .maybeSingle();

        if (!license) return deny("invalid");
        if (license.status !== "active") return deny("invalid");
        if (new Date(String(license.expires_at)).getTime() <= Date.now()) {
          await supabase.from("licenses").update({ status: "expired" }).eq("id", license.id);
          return deny("invalid");
        }

        if (!license.hwid_hash) {
          await supabase
            .from("licenses")
            .update({
              hwid_hash: hwidHash,
              first_bound_at: new Date().toISOString(),
              last_validated_at: new Date().toISOString(),
            })
            .eq("id", license.id);
          await supabase.from("license_audit").insert({
            license_id: license.id,
            action: "hwid_bound",
            source: "loader",
            metadata_minimal: { hwid_prefix: hwidHash.slice(0, 8) },
          });
        } else if (license.hwid_hash !== hwidHash) {
          await supabase.from("license_audit").insert({
            license_id: license.id,
            action: "hwid_mismatch",
            source: "loader",
            metadata_minimal: { hwid_prefix: hwidHash.slice(0, 8) },
          });
          return deny("invalid");
        } else {
          await supabase
            .from("licenses")
            .update({ last_validated_at: new Date().toISOString() })
            .eq("id", license.id);
        }

        return new Response(
          JSON.stringify({ valid: true, plan: license.plan, expires_at: license.expires_at }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
