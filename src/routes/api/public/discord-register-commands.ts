import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const FALLBACK_GUILD_ID = "1530601137462448400";

/** MANAGE_GUILD (1 << 5): only server managers see the command in the picker. */
const MANAGE_GUILD = "32";

/**
 * Registers the guild slash command for the reviews flow.
 * Protected by ADMIN_SETUP_SECRET (Authorization: Bearer <secret>).
 * Call once after deploy; re-callable safely.
 */
export const Route = createFileRoute("/api/public/discord-register-commands")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ADMIN_SETUP_SECRET"];
        const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!secret || !provided || !timingSafeEqual(secret, provided)) {
          return new Response("unauthorized", { status: 401 });
        }

        const appId = process.env["DISCORD_APPLICATION_ID"];
        const guildId = process.env["DISCORD_GUILD_ID"] ?? FALLBACK_GUILD_ID;
        if (!appId) return new Response("discord_config_missing", { status: 400 });

        const { discordFetch } = await import("@/lib/purchase/discord.server");
        const res = await discordFetch(`/applications/${appId}/guilds/${guildId}/commands`, {
          method: "PUT",
          body: [
            {
              name: "setup-recensioni",
              description: "Pubblica il pannello recensioni in questo canale (staff)",
              type: 1,
              default_member_permissions: MANAGE_GUILD,
              dm_permission: false,
            },
          ],
        });

        if (!res.ok) return new Response("discord_register_failed", { status: 502 });
        const registered = Array.isArray(res.json)
          ? res.json.map((c: { name?: string }) => String(c?.name ?? ""))
          : [];
        return new Response(JSON.stringify({ ok: true, registered }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
