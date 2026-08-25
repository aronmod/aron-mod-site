import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/discord-interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyDiscordSignature } = await import("@/lib/purchase/discord.server");
        const valid = await verifyDiscordSignature(
          request.headers.get("x-signature-ed25519"),
          request.headers.get("x-signature-timestamp"),
          raw,
        );
        if (!valid) return new Response("invalid request signature", { status: 401 });

        let body: any;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("bad request", { status: 400 });
        }

        // PING
        if (body?.type === 1) return json({ type: 1 });

        // MESSAGE_COMPONENT
        if (body?.type === 3) {
          const customId: string = String(body?.data?.custom_id ?? "");
          const userId: string | undefined = body?.member?.user?.id ?? body?.user?.id;
          if (!userId) return json({ type: 4, data: { content: "Errore utente.", flags: 64 } });

          const discord = await import("@/lib/purchase/discord.server");

          try {
            if (customId === "aron_purchase_start") {
              const channelId = await discord.ensureTicketChannel(userId);
              if (!channelId) {
                return json({
                  type: 4,
                  data: { content: "⚠️ Impossibile aprire il ticket. Contatta lo staff.", flags: 64 },
                });
              }
              await discord.sendChannelMessage(channelId, {
                content: [
                  `<@${userId}> 👋 Benvenuto / Welcome!`,
                  "Scegli il pacchetto / Choose your package:",
                  "**BASE** — funzioni principali · **PLUS** — include Auto Dungeon, Auto Alchimia, Switch Ammalia e HWID Spoofer (in base al server).",
                ].join("\n"),
                components: discord.planButtons(),
              });
              return json({
                type: 4,
                data: { content: `🎟️ Ticket aperto: <#${channelId}>`, flags: 64 },
              });
            }

            const planMatch = /^aron_plan_(base|plus)$/.exec(customId);
            if (planMatch) {
              const plan = planMatch[1] as "base" | "plus";
              return json({
                type: 4,
                data: {
                  content: `Piano **${plan.toUpperCase()}** selezionato. Scegli la durata / choose duration:`,
                  components: discord.daysButtons(plan),
                },
              });
            }

            const daysMatch = /^aron_days_(base|plus)_(15|30)$/.exec(customId);
            if (daysMatch) {
              const plan = daysMatch[1] as "base" | "plus";
              const days = Number(daysMatch[2]) as 15 | 30;
              const { createOrder } = await import("@/lib/purchase/orders.server");
              const { shortId } = await import("@/lib/purchase/crypto.server");
              const { formatEur } = await import("@/lib/purchase/pricing");

              const order = await createOrder({
                discordUserId: userId,
                ticketChannelId: body?.channel_id ? String(body.channel_id) : null,
                plan,
                days,
              });
              const url = `https://aronmod.net/checkout/${order.token}`;
              return json({
                type: 4,
                data: {
                  content: [
                    `🧾 **Ordine / Order** \`${shortId(order.id)}\``,
                    `Piano / Plan: **${plan.toUpperCase()}** · ${days} giorni / days`,
                    `Totale / Total: **${formatEur(order.amountCents)}**`,
                    `⏳ Il link scade tra 30 minuti / link expires in 30 minutes.`,
                  ].join("\n"),
                  components: discord.linkButton("Paga con PayPal", url),
                },
              });
            }
          } catch (err) {
            console.error("discord_interaction_error", {
              customId,
              message: err instanceof Error ? err.message : "unknown",
            });
            return json({
              type: 4,
              data: { content: "⚠️ Errore temporaneo. Riprova più tardi.", flags: 64 },
            });
          }

          return json({ type: 4, data: { content: "Azione non riconosciuta.", flags: 64 } });
        }

        return json({ type: 4, data: { content: "Non supportato.", flags: 64 } });
      },
    },
  },
});
