import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Publishes / refreshes the "🛒 Acquista Aron Mod" purchase panel.
 * Protected by ADMIN_SETUP_SECRET (Authorization: Bearer <secret>).
 */
export const Route = createFileRoute("/api/public/discord-admin-setup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ADMIN_SETUP_SECRET"];
        const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!secret || !provided || !timingSafeEqual(secret, provided)) {
          return new Response("unauthorized", { status: 401 });
        }

        const channelId = process.env["DISCORD_PURCHASE_CHANNEL_ID"];
        if (!channelId) return new Response("channel_not_configured", { status: 400 });

        const { sendChannelMessage } = await import("@/lib/purchase/discord.server");
        const res = await sendChannelMessage(channelId, {
          embeds: [
            {
              title: "🛒 Acquista Aron Mod",
              description: [
                "**IT** — Clicca il pulsante qui sotto per aprire un ticket privato, scegliere piano e durata e pagare con PayPal. La licenza viene attivata automaticamente.",
                "",
                "**EN** — Click the button below to open a private ticket, choose your plan and duration and pay with PayPal. Your license is activated automatically.",
                "",
                "BASE · 15gg 9 € · 30gg 15 €",
                "PLUS · 15gg 12 € · 30gg 20 €",
              ].join("\n"),
              color: 0x3b82f6,
            },
          ],
          components: [
            {
              type: 1,
              components: [
                { type: 2, style: 3, label: "Acquista / Buy", custom_id: "aron_purchase_start" },
              ],
            },
          ],
        });

        return new Response(JSON.stringify({ ok: res.ok }), {
          status: res.ok ? 200 : 502,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
