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

        const { discordFetch, sendChannelMessage, editChannelMessage } = await import(
          "@/lib/purchase/discord.server"
        );

        const panels = {
          it: {
            customId: "aron_purchase_start_it",
            body: {
              embeds: [
                {
                  title: "🛒 Acquista Aron Mod",
                  description: [
                    "Clicca il pulsante qui sotto per aprire un ticket privato in italiano, scegliere piano e durata e pagare con PayPal. Dopo il pagamento verificato lo staff ti assegna la KeyAuth key nel ticket.",
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
                    {
                      type: 2,
                      style: 3,
                      label: "🇮🇹 Acquista (Italiano)",
                      custom_id: "aron_purchase_start_it",
                    },
                  ],
                },
              ],
            },
          },
          en: {
            customId: "aron_purchase_start_en",
            body: {
              embeds: [
                {
                  title: "🛒 Buy Aron Mod",
                  description: [
                    "Click the button below to open a private ticket in English, choose your plan and duration and pay with PayPal. Once the payment is verified, the staff assigns your KeyAuth key in the ticket.",
                    "",
                    "BASE · 15d 9 € · 30d 15 €",
                    "PLUS · 15d 12 € · 30d 20 €",
                  ].join("\n"),
                  color: 0x3b82f6,
                },
              ],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      style: 3,
                      label: "🇬🇧 Buy (English)",
                      custom_id: "aron_purchase_start_en",
                    },
                  ],
                },
              ],
            },
          },
        } as const;

        // Reuse existing panels instead of spamming the channel. The legacy
        // bilingual panel (custom_id `aron_purchase_start`) becomes the IT one.
        const history = await discordFetch(`/channels/${channelId}/messages?limit=50`, {
          method: "GET",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: any[] = Array.isArray(history.json) ? history.json : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idsOf = (m: any): string[] =>
          (Array.isArray(m?.components) ? m.components : [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .flatMap((r: any) => (Array.isArray(r?.components) ? r.components : []))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any) => String(c?.custom_id ?? ""));

        const findPanel = (wanted: string[]) =>
          messages.find((m) => idsOf(m).some((id) => wanted.includes(id)));

        const result: Record<string, { messageId: string | null; ok: boolean; link: string }> = {};

        for (const [locale, panel] of Object.entries(panels)) {
          const existing = findPanel(
            locale === "it" ? [panel.customId, "aron_purchase_start"] : [panel.customId],
          );
          let messageId: string | null = existing?.id ? String(existing.id) : null;
          let ok = false;
          if (messageId) {
            const edited = await editChannelMessage(channelId, messageId, panel.body);
            ok = edited.ok;
            if (!edited.ok) messageId = null;
          }
          if (!messageId) {
            const sent = await sendChannelMessage(channelId, panel.body);
            ok = sent.ok;
            messageId = sent.json?.id ? String(sent.json.id) : null;
          }
          result[locale] = {
            messageId,
            ok,
            link: messageId
              ? `https://discord.com/channels/${process.env["DISCORD_GUILD_ID"]}/${channelId}/${messageId}`
              : "",
          };
        }

        const allOk = Object.values(result).every((r) => r.ok);
        return new Response(JSON.stringify({ ok: allOk, panels: result }), {
          status: allOk ? 200 : 502,
          headers: { "content-type": "application/json" },
        });
      },

    },
  },
});
