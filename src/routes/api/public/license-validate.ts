import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  license_key: z.string().min(8).max(128),
  hwid: z.string().min(8).max(256),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Generic response: never reveals whether the key exists. */
function deny() {
  return json({ valid: false, reason: "invalid" });
}

function tooMany() {
  return json({ valid: false, reason: "invalid" }, 429);
}

/** Prefer the Cloudflare-managed client IP; other client headers are spoofable. */
function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const Route = createFileRoute("/api/public/license-validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof schema>;
        try {
          parsed = schema.parse(await request.json());
        } catch {
          return deny();
        }

        const { hmacSha256Hex, requireSecret, sha256Hex } = await import(
          "@/lib/purchase/crypto.server"
        );
        const { getServiceClient } = await import("@/lib/purchase/db.server");
        const supabase = getServiceClient();

        const hwidSecret = requireSecret("HWID_HASH_SECRET");
        const keyNormalized = parsed.license_key.trim().toUpperCase();
        const keyHash = await sha256Hex(keyNormalized);
        const hwidHash = await hmacSha256Hex(hwidSecret, parsed.hwid.trim());

        // Rate limiting: only keyed fingerprints are stored, never raw IPs or keys.
        const ipFp = (await hmacSha256Hex(hwidSecret, `ip:${clientIp(request)}`)).slice(0, 32);
        const keyFp = (await hmacSha256Hex(hwidSecret, `key:${keyHash}`)).slice(0, 32);
        const limits = await Promise.all([
          supabase.rpc("bump_rate_limit", { _key: `ip:${ipFp}`, _limit: 60, _window_seconds: 60 }),
          supabase.rpc("bump_rate_limit", { _key: `key:${keyFp}`, _limit: 20, _window_seconds: 60 }),
        ]);
        if (limits.some((r) => r.data === false)) return tooMany();

        const { data, error } = await supabase.rpc("validate_license_hwid", {
          _key_hash: keyHash,
          _hwid_hash: hwidHash,
        });
        if (error) {
          console.error("license_validate_rpc_error", { code: error.code });
          return deny();
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return deny();

        const fingerprint = hwidHash.slice(0, 8);
        if (row.result === "bound" && row.license_id) {
          await supabase.from("license_audit").insert({
            license_id: row.license_id,
            action: "hwid_bound",
            source: "loader",
            metadata_minimal: { hwid_fp: fingerprint },
          });
        } else if (row.result === "hwid_mismatch" && row.license_id) {
          await supabase.from("license_audit").insert({
            license_id: row.license_id,
            action: "hwid_mismatch",
            source: "loader",
            metadata_minimal: { hwid_fp: fingerprint },
          });
        }

        if (row.result !== "valid" && row.result !== "bound") return deny();

        return json({ valid: true, plan: row.plan, expires_at: row.expires_at });
      },
    },
  },
});
