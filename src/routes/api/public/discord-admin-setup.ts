import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const FALLBACK_GUILD_ID = "1530601137462448400";
const FALLBACK_PURCHASE_CHANNEL_IT = "1530897133719257148";
const FALLBACK_PURCHASE_CHANNEL_EN = "1530897159820542103";

type Locale = "it" | "en";

function purchaseChannelId(locale: Locale): string {
  if (locale === "it") {
    return process.env["DISCORD_PURCHASE_CHANNEL_ID"] || FALLBACK_PURCHASE_CHANNEL_IT;
  }
  return process.env["DISCORD_PURCHASE_CHANNEL_ID_EN"] || FALLBACK_PURCHASE_CHANNEL_EN;
}

function guildId(): string {
  return process.env["DISCORD_GUILD_ID"] ?? FALLBACK_GUILD_ID;
}

type PanelMessage = {
  id?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    fields?: Array<{ name?: string; value?: string }>;
  }>;
  components?: Array<{
    components?: Array<{ custom_id?: string; label?: string; style?: number }>;
  }>;
};

function idsOf(message: PanelMessage): string[] {
  return (Array.isArray(message.components) ? message.components : [])
    .flatMap((row) => (Array.isArray(row.components) ? row.components : []))
    .map((component) => String(component.custom_id ?? ""))
    .filter(Boolean);
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

        const channels = {
          it: purchaseChannelId("it"),
          en: purchaseChannelId("en"),
        } as const;
        if (!channels.it || !channels.en) {
          return new Response("channel_not_configured", { status: 400 });
        }

        const { discordFetch, sendChannelMessage, editChannelMessage } =
          await import("@/lib/purchase/discord.server");

        const panels = {
          it: {
            customId: "aron_purchase_start_it",
            body: {
              embeds: [
                {
                  title: "🛒 Acquista Aron Mod",
                  description:
                    "Clicca **Acquista** e scegli il piano e la durata in base alle tue esigenze. Poi completa il pagamento con PayPal.\n\nDopo la verifica del pagamento, riceverai la key direttamente nel ticket.",
                  color: 0x3b82f6,
                  fields: [
                    {
                      name: "⭐ PLUS — Funzioni extra",
                      value:
                        "Auto Dungeon\nAuto Alchimia\nSwitch Ammalia\nHWID Spoofer\n\n*Disponibilità in base al server.*",
                      inline: false,
                    },
                    {
                      name: "BASE",
                      value: "**15 giorni** · **9 €**\n**30 giorni** · **15 €**",
                      inline: false,
                    },
                    {
                      name: "PLUS",
                      value: "**15 giorni** · **12 €**\n**30 giorni** · **20 €**",
                      inline: false,
                    },
                  ],
                },
              ],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      style: 1,
                      label: "🛒 Acquista ora",
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
                  description:
                    "Click **Buy** and choose the plan and duration that best suit your needs. Then complete the payment with PayPal.\n\nAfter the payment is verified, you will receive the key directly in the ticket.",
                  color: 0x3b82f6,
                  fields: [
                    {
                      name: "⭐ PLUS — Extra features",
                      value:
                        "Auto Dungeon\nAuto Alchemy\nAuto Enchant\nHWID Spoofer\n\n*Availability depends on the server.*",
                      inline: false,
                    },
                    {
                      name: "BASE",
                      value: "**15 days** · **€9**\n**30 days** · **€15**",
                      inline: false,
                    },
                    {
                      name: "PLUS",
                      value: "**15 days** · **€12**\n**30 days** · **€20**",
                      inline: false,
                    },
                  ],
                },
              ],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      style: 1,
                      label: "🛒 Buy now",
                      custom_id: "aron_purchase_start_en",
                    },
                  ],
                },
              ],
            },
          },
        } as const;

        const histories: Record<Locale, PanelMessage[]> = { it: [], en: [] };
        for (const locale of ["it", "en"] as const) {
          const history = await discordFetch(`/channels/${channels[locale]}/messages?limit=100`, {
            method: "GET",
          });
          histories[locale] = Array.isArray(history.json) ? history.json : [];
        }

        // Remove only misplaced Aron purchase panels from the opposite public channel.
        for (const message of histories.it) {
          if (message.id && idsOf(message).includes(panels.en.customId)) {
            await discordFetch(`/channels/${channels.it}/messages/${message.id}`, {
              method: "DELETE",
            });
          }
        }
        for (const message of histories.en) {
          if (message.id && idsOf(message).includes(panels.it.customId)) {
            await discordFetch(`/channels/${channels.en}/messages/${message.id}`, {
              method: "DELETE",
            });
          }
        }

        const result: Record<Locale, { messageId: string | null; ok: boolean; link: string }> = {
          it: { messageId: null, ok: false, link: "" },
          en: { messageId: null, ok: false, link: "" },
        };

        for (const locale of ["it", "en"] as const) {
          const panel = panels[locale];
          const channelId = channels[locale];
          const validMessages = histories[locale].filter((message) => {
            const ids = idsOf(message);
            return (
              ids.includes(panel.customId) ||
              (locale === "it" && ids.includes("aron_purchase_start"))
            );
          });
          const existing = validMessages[0];
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

          for (const duplicate of validMessages.slice(1)) {
            if (duplicate.id) {
              await discordFetch(`/channels/${channelId}/messages/${duplicate.id}`, {
                method: "DELETE",
              });
            }
          }

          result[locale] = {
            messageId,
            ok,
            link: messageId
              ? `https://discord.com/channels/${guildId()}/${channelId}/${messageId}`
              : "",
          };
        }

        // Independent re-scan: assert exactly one correct panel per channel
        // and zero cross-locale panels.
        const verify: Record<
          Locale,
          {
            it: number;
            en: number;
            exact: boolean;
            embedCount: number;
            titles: string[];
            buttonLabel: string;
            buttonStyle: number | null;
            hasPiano: boolean;
          }
        > = {
          it: {
            it: 0,
            en: 0,
            exact: false,
            embedCount: 0,
            titles: [],
            buttonLabel: "",
            buttonStyle: null,
            hasPiano: false,
          },
          en: {
            it: 0,
            en: 0,
            exact: false,
            embedCount: 0,
            titles: [],
            buttonLabel: "",
            buttonStyle: null,
            hasPiano: false,
          },
        };
        for (const locale of ["it", "en"] as const) {
          const rescan = await discordFetch(`/channels/${channels[locale]}/messages?limit=100`, {
            method: "GET",
          });
          const messages: PanelMessage[] = Array.isArray(rescan.json) ? rescan.json : [];
          for (const message of messages) {
            const ids = idsOf(message);
            if (ids.includes(panels.it.customId)) verify[locale].it += 1;
            if (ids.includes(panels.en.customId)) verify[locale].en += 1;

            if (ids.includes(panels[locale].customId)) {
              const embeds = Array.isArray(message.embeds) ? message.embeds : [];
              const button = (message.components ?? [])
                .flatMap((row) => row.components ?? [])
                .find((component) => component.custom_id === panels[locale].customId);
              const expectedTitles =
                locale === "it"
                  ? ["🛒 Acquista Aron Mod", "BASE", "PLUS"]
                  : ["🛒 Buy Aron Mod", "BASE", "PLUS"];
              const expectedLabel = locale === "it" ? "🛒 Acquista ora" : "🛒 Buy now";
              const serializedEmbeds = JSON.stringify(embeds);

              verify[locale].embedCount = embeds.length;
              verify[locale].titles = embeds.map((embed) => String(embed.title ?? ""));
              verify[locale].buttonLabel = String(button?.label ?? "");
              verify[locale].buttonStyle = typeof button?.style === "number" ? button.style : null;
              verify[locale].hasPiano = serializedEmbeds.includes("PIANO");
              verify[locale].exact =
                embeds.length === 3 &&
                verify[locale].titles.every((title, index) => title === expectedTitles[index]) &&
                button?.label === expectedLabel &&
                button.style === 1 &&
                !verify[locale].hasPiano;
            }
          }
        }

        const verified =
          verify.it.it === 1 &&
          verify.it.en === 0 &&
          verify.it.exact &&
          verify.en.en === 1 &&
          verify.en.it === 0 &&
          verify.en.exact;
        const allOk = Object.values(result).every((r) => r.ok) && verified;
        return new Response(JSON.stringify({ ok: allOk, panels: result, verify, channels }), {
          status: allOk ? 200 : 502,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
