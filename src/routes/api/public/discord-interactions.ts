import { createFileRoute } from "@tanstack/react-router";

import { runAfterResponse } from "@/lib/purchase/background.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Deferred ephemeral ACK: the real answer arrives via editOriginalInteraction. */
const DEFER_EPHEMERAL = { type: 5, data: { flags: 64 } };
/** Deferred update of the component's own message (equivalent to type 7). */
const DEFER_UPDATE = { type: 6 };

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

        // APPLICATION_COMMAND (slash commands)
        if (body?.type === 2) {
          const commandName = String(body?.data?.name ?? "");
          const interactionToken: string = String(body?.token ?? "");
          const discord = await import("@/lib/purchase/discord.server");
          const { rc } = await import("@/lib/reviews/reviews-copy.server");
          const setupLocale = String(body?.locale ?? "").startsWith("en") ? "en" : "it";
          const c = rc(setupLocale);

          if (commandName === "setup-recensioni") {
            if (!discord.isStaffInteraction(body)) {
              return json({ type: 4, data: { content: c.staffOnly, flags: 64 } });
            }
            const { reviewsChannelId } = await import("@/lib/reviews/reviews.server");
            const target = reviewsChannelId();
            const channelId: string | null = body?.channel_id ? String(body.channel_id) : null;
            if (!target) return json({ type: 4, data: { content: c.notConfigured, flags: 64 } });
            if (channelId !== target) {
              return json({ type: 4, data: { content: c.wrongChannel, flags: 64 } });
            }

            runAfterResponse(async () => {
              try {
                const { reviewPanelMessage } = await import("@/lib/reviews/reviews-discord.server");
                const messages = await discord.listChannelMessages(target, 100);
                type ReviewPanelMessage = {
                  id?: string;
                  components?: Array<{ components?: Array<{ custom_id?: string }> }>;
                };
                const candidates = (
                  Array.isArray(messages.json) ? messages.json : []
                ) as ReviewPanelMessage[];
                const panels = candidates.filter((message) =>
                  message.components?.some((row) =>
                    row.components?.some((component) => component.custom_id === "aron_review_open"),
                  ),
                );
                const panel = reviewPanelMessage(setupLocale);
                let sent = false;
                const current = panels[0];
                if (current?.id) {
                  sent = (await discord.editChannelMessage(target, current.id, panel)).ok;
                  for (const duplicate of panels.slice(1)) {
                    if (duplicate.id) await discord.deleteChannelMessage(target, duplicate.id);
                  }
                }
                if (!sent) sent = (await discord.sendChannelMessage(target, panel)).ok;
                await discord.editOriginalInteraction(interactionToken, {
                  content: sent ? c.panelPublished : c.genericError,
                });
              } catch (err) {
                console.error("review_setup_error", {
                  message: err instanceof Error ? err.message : "unknown",
                });
                await discord.editOriginalInteraction(interactionToken, {
                  content: c.genericError,
                });
              }
            });
            return json(DEFER_EPHEMERAL);
          }

          return json({ type: 4, data: { content: c.genericError, flags: 64 } });
        }

        // MESSAGE_COMPONENT
        if (body?.type === 3) {
          const customId: string = String(body?.data?.custom_id ?? "");
          const interactionToken: string = String(body?.token ?? "");
          const userId: string | undefined = body?.member?.user?.id ?? body?.user?.id;
          const reviewLocale = String(body?.locale ?? "").startsWith("en") ? "en" : "it";

          if (customId === "aron_review_open") {
            const { reviewModal } = await import("@/lib/reviews/reviews-discord.server");
            return json(reviewModal(reviewLocale));
          }

          const reviewAction = /^(aron_review_(approve|reject))_([0-9a-fA-F-]{36})$/.exec(customId);
          if (reviewAction) {
            const discord = await import("@/lib/purchase/discord.server");
            const { approverIds, getReview, markReviewed, reviewsChannelId, setPublicMessageId } =
              await import("@/lib/reviews/reviews.server");
            const { publicReviewMessage, sendDirectMessage } =
              await import("@/lib/reviews/reviews-discord.server");
            const { rc } = await import("@/lib/reviews/reviews-copy.server");
            const reviewerId = userId ?? "";
            if (!approverIds().includes(reviewerId)) {
              return json({ type: 4, data: { content: rc(reviewLocale).reviewerOnly, flags: 64 } });
            }

            runAfterResponse(async () => {
              const c = rc(reviewLocale);
              try {
                const review = await getReview(String(reviewAction[3]));
                if (!review) {
                  await discord.editOriginalInteraction(interactionToken, {
                    content: c.notFound,
                    components: [],
                  });
                  return;
                }
                const reviewLanguage = review.locale === "en" ? "en" : "it";
                const result = reviewAction[2] === "approve" ? "approved" : "rejected";
                const updated = await markReviewed(review.id, result, reviewerId);
                if (!updated) {
                  await discord.editOriginalInteraction(interactionToken, {
                    content: c.alreadyHandled,
                    components: [],
                  });
                  return;
                }

                if (result === "approved") {
                  const channelId = reviewsChannelId();
                  if (!channelId) throw new Error("reviews_channel_missing");
                  const published = await discord.sendChannelMessage(
                    channelId,
                    publicReviewMessage(reviewLanguage, {
                      rating: updated.rating,
                      body: updated.body,
                      createdAt: updated.created_at,
                    }),
                  );
                  if (!published.ok || !published.json?.id)
                    throw new Error("review_publish_failed");
                  await setPublicMessageId(updated.id, String(published.json.id));
                }

                await discord.editOriginalInteraction(interactionToken, {
                  content: result === "approved" ? c.approved : c.rejected,
                  components: [],
                });
                await sendDirectMessage(updated.discord_user_id, {
                  content:
                    result === "approved"
                      ? rc(reviewLanguage).dmApproved
                      : rc(reviewLanguage).dmRejected,
                });
              } catch (err) {
                console.error("review_moderation_error", {
                  message: err instanceof Error ? err.message : "unknown",
                });
                await discord.editOriginalInteraction(interactionToken, {
                  content: c.genericError,
                  components: [],
                });
              }
            });
            return json(DEFER_UPDATE);
          }

          const discord = await import("@/lib/purchase/discord.server");
          const { normalizeLocale, t } = await import("@/lib/purchase/discord-copy.server");
          const tickets = await import("@/lib/purchase/tickets.server");
          const interactionChannelId: string | null = body?.channel_id
            ? String(body.channel_id)
            : null;

          // Locale of the surrounding ticket, resolved lazily so the 3s ACK
          // budget is never spent on a DB round trip before deferring.
          const ctxCopy = async () => t(await tickets.ticketLocale(interactionChannelId));

          if (!userId) {
            runAfterResponse(async () => {
              await discord.editOriginalInteraction(interactionToken, {
                content: (await ctxCopy()).userError,
              });
            });
            return json(DEFER_EPHEMERAL);
          }

          const failEphemeral = async (message?: string) => {
            const content = message ?? (await ctxCopy()).genericError;
            await discord.editOriginalInteraction(interactionToken, { content });
          };

          const startMatch = /^aron_purchase_start(?:_(it|en))?$/.exec(customId);
          if (startMatch) {
            const locale = normalizeLocale(startMatch[1] ?? "it");
            const c = t(locale);
            runAfterResponse(async () => {
              try {
                const channelId = await discord.ensureTicketChannel(userId, locale);
                if (!channelId) {
                  await discord.editOriginalInteraction(interactionToken, {
                    content: c.ticketFailed,
                  });
                  return;
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

                await discord.editOriginalInteraction(interactionToken, {
                  content: c.ticketOpened(channelId),
                });
              } catch (err) {
                console.error("discord_interaction_error", {
                  customId,
                  message: err instanceof Error ? err.message : "unknown",
                });
                await discord.editOriginalInteraction(interactionToken, {
                  content: c.ticketFailed,
                });
              }
            });
            return json(DEFER_EPHEMERAL);
          }

          const planMatch = /^aron_plan_(base|plus)$/.exec(customId);
          if (planMatch) {
            const plan = planMatch[1] as "base" | "plus";
            runAfterResponse(async () => {
              try {
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

                // The plan panel is updated in place so only the chosen plan is green.
                await discord.editOriginalInteraction(
                  interactionToken,
                  discord.panelMessage(locale, userId, plan),
                );
              } catch (err) {
                console.error("discord_interaction_error", {
                  customId,
                  message: err instanceof Error ? err.message : "unknown",
                });
                await discord.followupInteraction(interactionToken, {
                  content: (await ctxCopy()).genericError,
                  flags: 64,
                });
              }
            });
            return json(DEFER_UPDATE);
          }

          const daysMatch = /^aron_days_(base|plus)_(15|30)$/.exec(customId);
          if (daysMatch) {
            const plan = daysMatch[1] as "base" | "plus";
            const days = Number(daysMatch[2]) as 15 | 30;
            const currentMessageId = body?.message?.id ? String(body.message.id) : null;
            const requestUrl = request.url;
            runAfterResponse(async () => {
              try {
                const ticket = interactionChannelId
                  ? await tickets.getTicket(interactionChannelId)
                  : null;
                const locale = ticket?.locale ?? (await tickets.ticketLocale(interactionChannelId));

                const { createOrder, cancelPendingOrdersForChannel, checkoutUrlFor } =
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
                const url = checkoutUrlFor(order.token, requestUrl);

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
                  if (ticket?.panelMessageId && ticket.panelMessageId !== currentMessageId) {
                    await discord.deleteChannelMessage(interactionChannelId, ticket.panelMessageId);
                  }
                  await tickets.updateTicket(interactionChannelId, {
                    panelMessageId: currentMessageId,
                    summaryMessageId: null,
                    selectedPlan: plan,
                    selectedDays: days,
                  });
                  await discord.editOriginalInteraction(interactionToken, final);
                  return;
                }

                await discord.followupInteraction(interactionToken, { ...final, flags: 64 });
              } catch (err) {
                console.error("discord_interaction_error", {
                  customId,
                  message: err instanceof Error ? err.message : "unknown",
                });
                await discord.followupInteraction(interactionToken, {
                  content: (await ctxCopy()).genericError,
                  flags: 64,
                });
              }
            });
            return json(interactionChannelId ? DEFER_UPDATE : DEFER_EPHEMERAL);
          }

          const uuidRe =
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

          const assignMatch = new RegExp(`^aron_assign_key_(${uuidRe})$`).exec(customId);
          const retryMatch = new RegExp(`^aron_retry_key_delivery_(${uuidRe})$`).exec(customId);
          const approveMatch = new RegExp(`^aron_approve_delivery_(${uuidRe})$`).exec(customId);

          if (assignMatch || retryMatch || approveMatch) {
            if (!discord.isStaffInteraction(body)) {
              runAfterResponse(async () => {
                await failEphemeral((await ctxCopy()).staffOnly);
              });
              return json(DEFER_EPHEMERAL);
            }

            if (approveMatch) {
              const orderId = String(approveMatch[1]);
              const staffId: string | undefined = body?.member?.user?.id;
              runAfterResponse(async () => {
                try {
                  const c = await ctxCopy();
                  if (!staffId) {
                    await failEphemeral(c.userError);
                    return;
                  }
                  const { getServiceClient } = await import("@/lib/purchase/db.server");
                  const supabase = getServiceClient();
                  const { data, error } = await supabase.rpc("approve_order_delivery", {
                    _order_id: orderId,
                    _staff_id: String(staffId),
                  });
                  if (error) throw new Error("approve_rpc_failed");
                  const row = Array.isArray(data) ? data[0] : data;
                  const result = String(row?.result ?? "");

                  if (result === "order_not_found" || result === "order_not_paid") {
                    await failEphemeral(c.orderNotReady);
                    return;
                  }
                  if (result === "already_approved") {
                    await failEphemeral(c.alreadyApproved);
                    return;
                  }

                  const channelId = row?.ticket_channel_id
                    ? String(row.ticket_channel_id)
                    : interactionChannelId;
                  if (channelId) {
                    const locale = await tickets.ticketLocale(channelId);
                    await discord.sendChannelMessage(channelId, {
                      content: t(locale).approvedNote,
                      components: discord.staffKeyButtons(orderId, locale),
                    });
                  }

                  await failEphemeral(c.approvedEphemeral);
                } catch (err) {
                  console.error("discord_interaction_error", {
                    customId,
                    message: err instanceof Error ? err.message : "unknown",
                  });
                  await failEphemeral();
                }
              });
              return json(DEFER_EPHEMERAL);
            }

            if (assignMatch) {
              // A modal must be the immediate response: it cannot be deferred.
              const orderId = String(assignMatch[1]);
              try {
                const { getServiceClient } = await import("@/lib/purchase/db.server");
                const supabase = getServiceClient();
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
                  return json({ type: 4, data: { content: c.orderNotReady, flags: 64 } });
                }
                if (order.fulfillment_status === "review_required") {
                  return json({ type: 4, data: { content: c.reviewRequiredAssign, flags: 64 } });
                }
                const { data: assignment } = await supabase
                  .from("keyauth_assignments")
                  .select("status")
                  .eq("purchase_order_id", orderId)
                  .maybeSingle();
                if (assignment?.status === "delivered") {
                  return json({ type: 4, data: { content: c.keyAlreadyDelivered, flags: 64 } });
                }
                if (assignment?.status === "pending") {
                  return json({ type: 4, data: { content: c.keyPending, flags: 64 } });
                }
                return json(discord.keyAuthModal(orderId, locale));
              } catch (err) {
                console.error("discord_interaction_error", {
                  customId,
                  message: err instanceof Error ? err.message : "unknown",
                });
                return json({ type: 4, data: { content: t("it").genericError, flags: 64 } });
              }
            }

            const orderId = String(retryMatch![1]);
            runAfterResponse(async () => {
              try {
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
                await failEphemeral(messages[result.status] ?? c.genericError);
              } catch (err) {
                console.error("discord_interaction_error", {
                  customId,
                  message: err instanceof Error ? err.message : "unknown",
                });
                await failEphemeral();
              }
            });
            return json(DEFER_EPHEMERAL);
          }

          runAfterResponse(async () => {
            await failEphemeral((await ctxCopy()).unknownAction);
          });
          return json(DEFER_EPHEMERAL);
        }

        // MODAL_SUBMIT
        if (body?.type === 5) {
          const customId: string = String(body?.data?.custom_id ?? "");
          const interactionToken: string = String(body?.token ?? "");
          const reviewLocale = String(body?.locale ?? "").startsWith("en") ? "en" : "it";
          const reviewChannelId = body?.channel_id ? String(body.channel_id) : null;

          if (customId === "aron_review_modal") {
            const discord = await import("@/lib/purchase/discord.server");
            const { rc } = await import("@/lib/reviews/reviews-copy.server");
            const {
              approverIds,
              createPendingReview,
              parseRating,
              reviewRateLimitOk,
              reviewsChannelId,
              sanitizeReviewBody,
            } = await import("@/lib/reviews/reviews.server");
            const { reviewerDmCard, sendDirectMessage } =
              await import("@/lib/reviews/reviews-discord.server");
            const c = rc(reviewLocale);
            const target = reviewsChannelId();
            const memberUser = body?.member?.user ?? body?.user;
            const userId = typeof memberUser?.id === "string" ? memberUser.id : "";
            const username =
              typeof memberUser?.global_name === "string"
                ? memberUser.global_name
                : typeof memberUser?.username === "string"
                  ? memberUser.username
                  : null;
            type ModalField = { custom_id?: string; value?: string };
            type ModalRow = { components?: ModalField[] };
            const rawRows: unknown[] = Array.isArray(body?.data?.components)
              ? body.data.components
              : [];
            const fields: ModalField[] = rawRows.flatMap((rawRow) => {
              const row = rawRow as ModalRow;
              return Array.isArray(row.components) ? row.components : [];
            });
            const rawRating =
              fields.find((field) => field.custom_id === "review_rating")?.value ?? "";
            const rawBody = fields.find((field) => field.custom_id === "review_body")?.value ?? "";

            runAfterResponse(async () => {
              const reply = async (content: string) => {
                await discord.editOriginalInteraction(interactionToken, { content });
              };
              try {
                if (!target || reviewChannelId !== target) {
                  await reply(c.notConfigured);
                  return;
                }
                if (!userId) {
                  await reply(c.genericError);
                  return;
                }
                if (approverIds().length === 0) {
                  await reply(c.noReviewers);
                  return;
                }
                const rating = parseRating(rawRating);
                const bodyText = sanitizeReviewBody(rawBody);
                if (rating === null) {
                  await reply(c.invalidRating);
                  return;
                }
                if (bodyText.length < 20 || bodyText.length > 1000) {
                  await reply(c.invalidBody);
                  return;
                }
                if (!(await reviewRateLimitOk(userId))) {
                  await reply(c.rateLimited);
                  return;
                }

                const result = await createPendingReview({
                  discordUserId: userId,
                  discordUsername: username,
                  locale: reviewLocale,
                  rating,
                  body: bodyText,
                });
                if (result.status === "pending_exists") {
                  await reply(c.alreadyPending);
                  return;
                }
                if (result.status === "approved_exists") {
                  await reply(c.alreadyApproved);
                  return;
                }
                if (result.status !== "created") {
                  await reply(c.genericError);
                  return;
                }

                const review = result.review;
                const reviewerPayload = reviewerDmCard(reviewLocale, {
                  id: review.id,
                  discordUserId: review.discord_user_id,
                  discordUsername: review.discord_username,
                  rating: review.rating,
                  body: review.body,
                  createdAt: review.created_at,
                });
                const reviewerResults = await Promise.all(
                  approverIds().map((reviewerId) => sendDirectMessage(reviewerId, reviewerPayload)),
                );
                if (!reviewerResults.some(Boolean)) {
                  console.error("reviewer_dm_failed", { reviewId: review.id });
                }
                await reply(c.submitted);
              } catch (err) {
                console.error("review_submit_error", {
                  message: err instanceof Error ? err.message : "unknown",
                });
                await reply(c.genericError);
              }
            });
            return json(DEFER_EPHEMERAL);
          }

          const { t } = await import("@/lib/purchase/discord-copy.server");
          const discord = await import("@/lib/purchase/discord.server");
          const tickets = await import("@/lib/purchase/tickets.server");
          const channelId = body?.channel_id ? String(body.channel_id) : null;
          const match =
            /^aron_key_modal_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.exec(
              customId,
            );
          if (!match) {
            runAfterResponse(async () => {
              const locale = await tickets.ticketLocale(channelId);
              await discord.editOriginalInteraction(interactionToken, {
                content: t(locale).invalidAction,
              });
            });
            return json(DEFER_EPHEMERAL);
          }

          const orderId = String(match[1]);
          const staffOk = discord.isStaffInteraction(body);
          const staffId: string | undefined = body?.member?.user?.id;
          // The raw key exists only in this request and inside the AES-GCM outbox.
          type ModalField = { custom_id?: string; value?: string };
          type ModalRow = { components?: ModalField[] };
          const rows: ModalRow[] = Array.isArray(body?.data?.components)
            ? body.data.components
            : [];
          const field = rows
            .flatMap((r) => (Array.isArray(r?.components) ? r.components : []))
            .find((f) => f?.custom_id === "keyauth_key");
          const rawKey = typeof field?.value === "string" ? field.value.trim() : "";

          runAfterResponse(async () => {
            let c = t("it");
            const reply = async (content: string) => {
              await discord.editOriginalInteraction(interactionToken, { content });
            };
            try {
              const { orderLocale } = await import("@/lib/purchase/fulfillment.server");
              c = t(await orderLocale(orderId, channelId));
            } catch {
              /* Keep Italian as the safest fallback for staff modal errors. */
            }
            try {
              if (!staffOk) {
                await reply(c.staffOnly);
                return;
              }
              if (!staffId) {
                await reply(c.userError);
                return;
              }
              if (!/^[\w.@:-]{8,128}$/.test(rawKey)) {
                await reply(c.keyInvalid);
                return;
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
                await reply(c.orderNotReady);
                return;
              }
              if (result === "review_required") {
                await reply(c.reviewRequiredModal);
                return;
              }
              if (result === "already_delivered") {
                await reply(c.keyAlreadyAssigned);
                return;
              }

              const { deliverPendingKey } = await import("@/lib/purchase/fulfillment.server");
              const delivery = await deliverPendingKey(orderId);
              await reply(
                delivery.status === "delivered" ? c.assignDelivered : c.assignDeliveryFailed,
              );
            } catch (err) {
              console.error("discord_modal_error", {
                orderId,
                message: err instanceof Error ? err.message : "unknown",
              });
              await reply(c.genericError);
            }
          });
          return json(DEFER_EPHEMERAL);
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
