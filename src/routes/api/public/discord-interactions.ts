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
      GET: async () =>
        json({
          ok: true,
          route: "discord-interactions",
          publicKeyConfigured: Boolean(process.env["DISCORD_PUBLIC_KEY"]),
        }),
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyDiscordSignature } = await import("@/lib/purchase/discord.server");
        const valid = await verifyDiscordSignature(
          request.headers.get("x-signature-ed25519"),
          request.headers.get("x-signature-timestamp"),
          raw,
        );
        if (!valid) return new Response("invalid request signature", { status: 401 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          const discord = await import("@/lib/purchase/discord.server");
          const { normalizeLocale, t } = await import("@/lib/purchase/discord-copy.server");
          const tickets = await import("@/lib/purchase/tickets.server");
          const interactionChannelId: string | null = body?.channel_id
            ? String(body.channel_id)
            : null;

          if (!userId) return json({ type: 4, data: { content: "Errore utente.", flags: 64 } });

          try {
            const startMatch = /^aron_purchase_start(?:_(it|en))?$/.exec(customId);
            if (startMatch) {
              const locale = normalizeLocale(startMatch[1] ?? "it");
              const c = t(locale);
              const channelId = await discord.ensureTicketChannel(userId, locale);
              if (!channelId) {
                return json({ type: 4, data: { content: c.ticketFailed, flags: 64 } });
              }

              const existing = await tickets.getTicket(channelId);
              await tickets.upsertTicket({ channelId, discordUserId: userId, locale });
              const panel = discord.panelMessage(
                locale,
                userId,
                existing?.selectedPlan ?? null,
                existing?.selectedDays ?? null,
              );

              let panelMessageId = existing?.panelMessageId ?? null;
              if (panelMessageId) {
                const edited = await discord.editChannelMessage(channelId, panelMessageId, panel);
                if (!edited.ok) panelMessageId = null;
              }
              if (!panelMessageId) {
                const sent = await discord.sendChannelMessage(channelId, panel);
                panelMessageId = sent.json?.id ? String(sent.json.id) : null;
              }
              await tickets.updateTicket(channelId, { panelMessageId });

              return json({ type: 4, data: { content: c.ticketOpened(channelId), flags: 64 } });
            }

            const planMatch = /^aron_plan_(base|plus)$/.exec(customId);
            if (planMatch) {
              const plan = planMatch[1] as "base" | "plus";
              const ticket = interactionChannelId
                ? await tickets.getTicket(interactionChannelId)
                : null;
              const locale = ticket?.locale ?? "it";

              if (interactionChannelId) {
                // Switching plan invalidates the previous selection: the old
                // unpaid order and its summary must disappear.
                const { cancelPendingOrdersForChannel } = await import(
                  "@/lib/purchase/orders.server"
                );
                await cancelPendingOrdersForChannel(interactionChannelId);
                if (ticket?.summaryMessageId) {
                  await discord.deleteChannelMessage(
                    interactionChannelId,
                    ticket.summaryMessageId,
                  );
                }
                await tickets.updateTicket(interactionChannelId, {
                  selectedPlan: plan,
                  selectedDays: null,
                  summaryMessageId: null,
                });
              }

              return json({ type: 7, data: discord.panelMessage(locale, userId, plan, null) });
            }

            const daysMatch = /^aron_days_(base|plus)_(15|30)$/.exec(customId);
            if (daysMatch) {
              const plan = daysMatch[1] as "base" | "plus";
              const days = Number(daysMatch[2]) as 15 | 30;
              const ticket = interactionChannelId
                ? await tickets.getTicket(interactionChannelId)
                : null;
              const locale = ticket?.locale ?? "it";
              const c = t(locale);

              const { createOrder, cancelPendingOrdersForChannel } = await import(
                "@/lib/purchase/orders.server"
              );
              const { shortId } = await import("@/lib/purchase/crypto.server");

              // Exactly one active awaiting_payment order per ticket.
              if (interactionChannelId) await cancelPendingOrdersForChannel(interactionChannelId);

              const order = await createOrder({
                discordUserId: userId,
                ticketChannelId: interactionChannelId,
                plan,
                days,
                locale,
              });
              // In sandbox/dev the stable dev host returns 403 on non-API pages,
              // so point the checkout link at the authenticated preview host.
              const SANDBOX_CHECKOUT_ORIGIN =
                "https://id-preview--1c134ef5-f387-4545-90d6-32fe56e14d6a.lovable.app";
              const checkoutBase =
                process.env["PAYPAL_ENV"] === "sandbox" ? SANDBOX_CHECKOUT_ORIGIN : request.url;
              const url = new URL(`/checkout/${order.token}`, checkoutBase).toString();

              const summary = {
                content: c.summary(shortId(order.id), plan, days, order.amountCents),
                components: discord.payButton(locale, url),
              };

              if (interactionChannelId) {
                let summaryMessageId = ticket?.summaryMessageId ?? null;
                if (summaryMessageId) {
                  const edited = await discord.editChannelMessage(
                    interactionChannelId,
                    summaryMessageId,
                    summary,
                  );
                  if (!edited.ok) summaryMessageId = null;
                }
                if (!summaryMessageId) {
                  const sent = await discord.sendChannelMessage(interactionChannelId, summary);
                  summaryMessageId = sent.json?.id ? String(sent.json.id) : null;
                }
                await tickets.updateTicket(interactionChannelId, {
                  selectedPlan: plan,
                  selectedDays: days,
                  summaryMessageId,
                });
                return json({ type: 7, data: discord.panelMessage(locale, userId, plan, days) });
              }

              return json({ type: 4, data: { ...summary, flags: 64 } });
            }


            const uuidRe =
              "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

            const assignMatch = new RegExp(`^aron_assign_key_(${uuidRe})$`).exec(customId);
            const retryMatch = new RegExp(`^aron_retry_key_delivery_(${uuidRe})$`).exec(customId);
            const approveMatch = new RegExp(`^aron_approve_delivery_(${uuidRe})$`).exec(customId);

            if (assignMatch || retryMatch || approveMatch) {
              if (!discord.isStaffInteraction(body)) {
                return json({
                  type: 4,
                  data: {
                    content:
                      "⛔ Azione riservata allo staff. / Staff only.\n_Se sei staff e vedi questo messaggio, `DISCORD_STAFF_ROLE_ID` non è configurato correttamente._",
                    flags: 64,
                  },
                });
              }

              const { getServiceClient } = await import("@/lib/purchase/db.server");
              const supabase = getServiceClient();

              if (approveMatch) {
                const orderId = String(approveMatch[1]);
                const staffId: string | undefined = body?.member?.user?.id;
                if (!staffId)
                  return json({ type: 4, data: { content: "Errore utente.", flags: 64 } });

                const { data, error } = await supabase.rpc("approve_order_delivery", {
                  _order_id: orderId,
                  _staff_id: String(staffId),
                });
                if (error) throw new Error("approve_rpc_failed");
                const row = Array.isArray(data) ? data[0] : data;
                const result = String(row?.result ?? "");

                if (result === "order_not_found" || result === "order_not_paid") {
                  return json({
                    type: 4,
                    data: { content: "⚠️ Ordine non trovato o non pagato.", flags: 64 },
                  });
                }
                if (result === "already_approved") {
                  return json({
                    type: 4,
                    data: {
                      content: "ℹ️ Consegna già approvata per questo ordine.",
                      flags: 64,
                    },
                  });
                }

                const channelId = row?.ticket_channel_id
                  ? String(row.ticket_channel_id)
                  : body?.channel_id
                    ? String(body.channel_id)
                    : null;
                if (channelId) {
                  const locale = await tickets.ticketLocale(channelId);
                  await discord.sendChannelMessage(channelId, {
                    content: t(locale).approvedNote,
                    components: discord.staffKeyButtons(orderId),
                  });
                }

                return json({
                  type: 4,
                  data: {
                    content: "✅ Consegna approvata. Ora puoi assegnare la KeyAuth key.",
                    flags: 64,
                  },
                });
              }

              if (assignMatch) {
                const orderId = String(assignMatch[1]);
                const { data: order } = await supabase
                  .from("purchase_orders")
                  .select("id, status, fulfillment_status")
                  .eq("id", orderId)
                  .maybeSingle();
                if (!order || order.status !== "paid") {
                  return json({
                    type: 4,
                    data: { content: "⚠️ Ordine non trovato o non pagato.", flags: 64 },
                  });
                }
                if (order.fulfillment_status === "review_required") {
                  return json({
                    type: 4,
                    data: {
                      content:
                        "🕵️ Ordine in **revisione manuale**: usa prima **Approva consegna (staff)**.",
                      flags: 64,
                    },
                  });
                }
                const { data: assignment } = await supabase
                  .from("keyauth_assignments")
                  .select("status")
                  .eq("purchase_order_id", orderId)
                  .maybeSingle();
                if (assignment?.status === "delivered") {
                  return json({
                    type: 4,
                    data: { content: "ℹ️ Key già assegnata e consegnata.", flags: 64 },
                  });
                }
                if (assignment?.status === "pending") {
                  return json({
                    type: 4,
                    data: {
                      content:
                        "ℹ️ Una key è già registrata ma non consegnata. Usa **Riprova consegna**.",
                      flags: 64,
                    },
                  });
                }
                return json(discord.keyAuthModal(orderId));
              }

              const orderId = String(retryMatch![1]);
              const { deliverPendingKey } = await import("@/lib/purchase/fulfillment.server");
              const result = await deliverPendingKey(orderId);
              const messages: Record<string, string> = {
                delivered: "✅ Key consegnata nel ticket.",
                nothing_pending: "ℹ️ Nessuna consegna pendente per questo ordine.",
                no_channel: "⚠️ Nessun canale ticket associato all'ordine.",
                failed: "⚠️ Consegna fallita. Riprova tra poco.",
              };
              return json({
                type: 4,
                data: { content: messages[result.status] ?? "⚠️ Errore.", flags: 64 },
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

        // MODAL_SUBMIT
        if (body?.type === 5) {
          const customId: string = String(body?.data?.custom_id ?? "");
          const match =
            /^aron_key_modal_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.exec(
              customId,
            );
          if (!match) return json({ type: 4, data: { content: "Azione non valida.", flags: 64 } });

          const discord = await import("@/lib/purchase/discord.server");
          if (!discord.isStaffInteraction(body)) {
            return json({
              type: 4,
              data: { content: "⛔ Azione riservata allo staff. / Staff only.", flags: 64 },
            });
          }
          const staffId: string | undefined = body?.member?.user?.id;
          if (!staffId) return json({ type: 4, data: { content: "Errore utente.", flags: 64 } });

          const orderId = String(match[1]);
          try {
            // The raw key exists only here and inside the AES-GCM outbox. Never logged.
            type ModalField = { custom_id?: string; value?: string };
            type ModalRow = { components?: ModalField[] };
            const rows: ModalRow[] = Array.isArray(body?.data?.components)
              ? body.data.components
              : [];
            const field = rows
              .flatMap((r) => (Array.isArray(r?.components) ? r.components : []))
              .find((c) => c?.custom_id === "keyauth_key");
            const rawKey = typeof field?.value === "string" ? field.value.trim() : "";
            if (!/^[\w.@:-]{8,128}$/.test(rawKey)) {
              return json({
                type: 4,
                data: {
                  content: "⚠️ Key non valida (8–128 caratteri alfanumerici, `-` `_` `.` `:` `@`).",
                  flags: 64,
                },
              });
            }

            const { encryptSecretValue, last4, sha256Hex } =
              await import("@/lib/purchase/crypto.server");
            const { getServiceClient } = await import("@/lib/purchase/db.server");
            const supabase = getServiceClient();
            const encrypted = await encryptSecretValue(rawKey);

            const { data, error } = await supabase.rpc("assign_keyauth_key", {
              _order_id: orderId,
              _assigned_by: staffId,
              _key_hash: await sha256Hex(rawKey),
              _key_last4: last4(rawKey),
              _ciphertext: encrypted.ciphertext,
              _iv: encrypted.iv,
            });
            if (error) throw new Error("assign_rpc_failed");
            const row = Array.isArray(data) ? data[0] : data;
            const result = String(row?.result ?? "");

            if (result === "order_not_found" || result === "order_not_paid") {
              return json({
                type: 4,
                data: { content: "⚠️ Ordine non trovato o non pagato.", flags: 64 },
              });
            }
            if (result === "review_required") {
              return json({
                type: 4,
                data: {
                  content:
                    "🕵️ Ordine in **revisione manuale**: approva prima la consegna con **Approva consegna (staff)**. Nessuna key è stata salvata.",
                  flags: 64,
                },
              });
            }
            if (result === "already_delivered") {
              return json({
                type: 4,
                data: { content: "ℹ️ Key già assegnata a questo ordine.", flags: 64 },
              });
            }

            const { deliverPendingKey } = await import("@/lib/purchase/fulfillment.server");
            const delivery = await deliverPendingKey(orderId);
            return json({
              type: 4,
              data: {
                content:
                  delivery.status === "delivered"
                    ? "✅ Key registrata e consegnata nel ticket."
                    : "⚠️ Key registrata in modo sicuro ma consegna fallita. Usa **Riprova consegna** (non serve reinserirla).",
                flags: 64,
              },
            });
          } catch (err) {
            console.error("discord_modal_error", {
              orderId,
              message: err instanceof Error ? err.message : "unknown",
            });
            return json({
              type: 4,
              data: { content: "⚠️ Errore temporaneo. Riprova più tardi.", flags: 64 },
            });
          }
        }

        return json({ type: 4, data: { content: "Non supportato.", flags: 64 } });
      },
    },
  },
});
