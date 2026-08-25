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

          // Locale of the surrounding ticket, used for every generic reply.
          const ctxLocale = await tickets.ticketLocale(interactionChannelId);
          const ctxCopy = t(ctxLocale);

          if (!userId) return json({ type: 4, data: { content: ctxCopy.userError, flags: 64 } });

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
              const panel = discord.panelMessage(locale, userId);

              // Any leftover duration message from a previous attempt is removed:
              // at most one plan panel + one duration message can be visible.
              if (existing?.summaryMessageId) {
                await discord.deleteChannelMessage(channelId, existing.summaryMessageId);
              }

              let panelMessageId = existing?.panelMessageId ?? null;
              if (panelMessageId) {
                const edited = await discord.editChannelMessage(channelId, panelMessageId, panel);
                if (!edited.ok) panelMessageId = null;
              }
              if (!panelMessageId) {
                const sent = await discord.sendChannelMessage(channelId, panel);
                panelMessageId = sent.json?.id ? String(sent.json.id) : null;
              }
              await tickets.updateTicket(channelId, {
                panelMessageId,
                summaryMessageId: null,
                selectedPlan: null,
                selectedDays: null,
              });

              return json({ type: 4, data: { content: c.ticketOpened(channelId), flags: 64 } });
            }

            const planMatch = /^aron_plan_(base|plus)$/.exec(customId);
            if (planMatch) {
              const plan = planMatch[1] as "base" | "plus";
              const ticket = interactionChannelId
                ? await tickets.getTicket(interactionChannelId)
                : null;
              const locale = ticket?.locale ?? (await tickets.ticketLocale(interactionChannelId));

              if (interactionChannelId) {
                // Switching plan invalidates any previous unpaid order (backend only).
                const { cancelPendingOrdersForChannel } =
                  await import("@/lib/purchase/orders.server");
                await cancelPendingOrdersForChannel(interactionChannelId);

                // Exactly one duration message: edit it in place when it exists.
                const duration = discord.durationMessage(locale, plan);
                let durationMessageId = ticket?.summaryMessageId ?? null;
                if (durationMessageId) {
                  const edited = await discord.editChannelMessage(
                    interactionChannelId,
                    durationMessageId,
                    duration,
                  );
                  if (!edited.ok) durationMessageId = null;
                }
                if (!durationMessageId) {
                  const sent = await discord.sendChannelMessage(interactionChannelId, duration);
                  durationMessageId = sent.json?.id ? String(sent.json.id) : null;
                }

                await tickets.updateTicket(interactionChannelId, {
                  panelMessageId: body?.message?.id
                    ? String(body.message.id)
                    : (ticket?.panelMessageId ?? null),
                  selectedPlan: plan,
                  selectedDays: null,
                  summaryMessageId: durationMessageId,
                });

              }

              // The plan panel stays untouched and clean.
              return json({ type: 6 });
            }

            const daysMatch = /^aron_days_(base|plus)_(15|30)$/.exec(customId);
            if (daysMatch) {
              const plan = daysMatch[1] as "base" | "plus";
              const days = Number(daysMatch[2]) as 15 | 30;
              const ticket = interactionChannelId
                ? await tickets.getTicket(interactionChannelId)
                : null;
              const locale = ticket?.locale ?? (await tickets.ticketLocale(interactionChannelId));

              const { createOrder, cancelPendingOrdersForChannel } =
                await import("@/lib/purchase/orders.server");
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

              const final = discord.finalOrderMessage(
                locale,
                userId,
                shortId(order.id),
                plan,
                days,
                order.amountCents,
                url,
              );

              if (interactionChannelId) {
                // The duration message (this interaction's message) becomes the
                // single final order message; the plan panel is removed.
                const currentMessageId = body?.message?.id ? String(body.message.id) : null;
                if (ticket?.panelMessageId && ticket.panelMessageId !== currentMessageId) {
                  await discord.deleteChannelMessage(interactionChannelId, ticket.panelMessageId);
                }
                await tickets.updateTicket(interactionChannelId, {
                  panelMessageId: currentMessageId,
                  summaryMessageId: null,
                  selectedPlan: plan,
                  selectedDays: days,
                });
                return json({ type: 7, data: final });
              }

              return json({ type: 4, data: { ...final, flags: 64 } });
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
                  data: { content: ctxCopy.staffOnly, flags: 64 },
                });
              }

              const { getServiceClient } = await import("@/lib/purchase/db.server");
              const supabase = getServiceClient();

              if (approveMatch) {
                const orderId = String(approveMatch[1]);
                const staffId: string | undefined = body?.member?.user?.id;
                if (!staffId)
                  return json({ type: 4, data: { content: ctxCopy.userError, flags: 64 } });

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
                    data: { content: ctxCopy.orderNotReady, flags: 64 },
                  });
                }
                if (result === "already_approved") {
                  return json({
                    type: 4,
                    data: { content: ctxCopy.alreadyApproved, flags: 64 },
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
                    components: discord.staffKeyButtons(orderId, locale),
                  });
                }

                return json({
                  type: 4,
                  data: { content: ctxCopy.approvedEphemeral, flags: 64 },
                });
              }

              if (assignMatch) {
                const orderId = String(assignMatch[1]);
                const { data: order } = await supabase
                  .from("purchase_orders")
                  .select("id, status, fulfillment_status, locale, discord_ticket_channel_id")
                  .eq("id", orderId)
                  .maybeSingle();
                const locale =
                  order?.locale === "it" || order?.locale === "en"
                    ? order.locale
                    : await tickets.ticketLocale(
                        order?.discord_ticket_channel_id
                          ? String(order.discord_ticket_channel_id)
                          : interactionChannelId,
                      );
                const c = t(locale);
                if (!order || order.status !== "paid") {
                  return json({
                    type: 4,
                    data: { content: c.orderNotReady, flags: 64 },
                  });
                }
                if (order.fulfillment_status === "review_required") {
                  return json({
                    type: 4,
                    data: { content: c.reviewRequiredAssign, flags: 64 },
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
                    data: { content: c.keyAlreadyDelivered, flags: 64 },
                  });
                }
                if (assignment?.status === "pending") {
                  return json({
                    type: 4,
                    data: { content: c.keyPending, flags: 64 },
                  });
                }
                return json(discord.keyAuthModal(orderId, locale));
              }

              const orderId = String(retryMatch![1]);
              const { deliverPendingKey, orderLocale } =
                await import("@/lib/purchase/fulfillment.server");
              const locale = await orderLocale(orderId, interactionChannelId);
              const c = t(locale);
              const result = await deliverPendingKey(orderId);
              const messages: Record<string, string> = {
                delivered: c.retryDelivered,
                nothing_pending: c.retryNothing,
                no_channel: c.retryNoChannel,
                failed: c.retryFailed,
              };
              return json({
                type: 4,
                data: { content: messages[result.status] ?? c.genericError, flags: 64 },
              });
            }
          } catch (err) {
            console.error("discord_interaction_error", {
              customId,
              message: err instanceof Error ? err.message : "unknown",
            });
            return json({
              type: 4,
              data: { content: ctxCopy.genericError, flags: 64 },
            });
          }

          return json({ type: 4, data: { content: ctxCopy.unknownAction, flags: 64 } });
        }

        // MODAL_SUBMIT
        if (body?.type === 5) {
          const customId: string = String(body?.data?.custom_id ?? "");
          const { t } = await import("@/lib/purchase/discord-copy.server");
          const tickets = await import("@/lib/purchase/tickets.server");
          const fallbackLocale = await tickets.ticketLocale(
            body?.channel_id ? String(body.channel_id) : null,
          );
          const fallbackCopy = t(fallbackLocale);
          const match =
            /^aron_key_modal_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.exec(
              customId,
            );
          if (!match) {
            return json({ type: 4, data: { content: fallbackCopy.invalidAction, flags: 64 } });
          }

          const discord = await import("@/lib/purchase/discord.server");
          const orderId = String(match[1]);
          let c = t("it");
          try {
            const { orderLocale } = await import("@/lib/purchase/fulfillment.server");
            const locale = await orderLocale(
              orderId,
              body?.channel_id ? String(body.channel_id) : null,
            );
            c = t(locale);
          } catch {
            /* Keep Italian as the safest fallback for staff modal errors. */
          }
          if (!discord.isStaffInteraction(body)) {
            return json({
              type: 4,
              data: { content: c.staffOnly, flags: 64 },
            });
          }
          const staffId: string | undefined = body?.member?.user?.id;
          if (!staffId) return json({ type: 4, data: { content: c.userError, flags: 64 } });
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
                data: { content: c.keyInvalid, flags: 64 },
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
                data: { content: c.orderNotReady, flags: 64 },
              });
            }
            if (result === "review_required") {
              return json({
                type: 4,
                data: { content: c.reviewRequiredModal, flags: 64 },
              });
            }
            if (result === "already_delivered") {
              return json({
                type: 4,
                data: { content: c.keyAlreadyAssigned, flags: 64 },
              });
            }

            const { deliverPendingKey } = await import("@/lib/purchase/fulfillment.server");
            const delivery = await deliverPendingKey(orderId);
            return json({
              type: 4,
              data: {
                content:
                  delivery.status === "delivered" ? c.assignDelivered : c.assignDeliveryFailed,
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
              data: { content: c.genericError, flags: 64 },
            });
          }
        }

        const { t } = await import("@/lib/purchase/discord-copy.server");
        const tickets = await import("@/lib/purchase/tickets.server");
        const locale = await tickets.ticketLocale(
          body?.channel_id ? String(body.channel_id) : null,
        );
        return json({ type: 4, data: { content: t(locale).unsupported, flags: 64 } });
      },
    },
  },
});
