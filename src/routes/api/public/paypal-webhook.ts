import { createFileRoute } from "@tanstack/react-router";

/* eslint-disable @typescript-eslint/no-explicit-any */

function relatedIds(resource: any): { orderId: string | null; captureId: string | null } {
  const rel = resource?.supplementary_data?.related_ids ?? {};
  return {
    orderId: rel?.order_id ? String(rel.order_id) : null,
    captureId: rel?.capture_id ? String(rel.capture_id) : null,
  };
}

/** Capture id from a rel=up link, accepted only for the documented capture path. */
function captureIdFromLinks(resource: any): string | null {
  const links = Array.isArray(resource?.links) ? resource.links : [];
  for (const link of links) {
    if (link?.rel !== "up" || typeof link?.href !== "string") continue;
    try {
      const path = new URL(link.href).pathname;
      const match = /^\/v2\/payments\/captures\/([A-Za-z0-9-_]+)$/.exec(path);
      if (match?.[1]) return match[1];
    } catch {
      /* ignore malformed link */
    }
  }
  return null;
}

export const Route = createFileRoute("/api/public/paypal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyWebhookSignature } = await import("@/lib/purchase/paypal.server");
        const verified = await verifyWebhookSignature(request.headers, raw);
        if (!verified) return new Response("invalid signature", { status: 401 });

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("bad request", { status: 400 });
        }

        const eventId = String(event?.id ?? "");
        const eventType = String(event?.event_type ?? "");
        if (!eventId || !eventType) return new Response("bad request", { status: 400 });

        const { getServiceClient } = await import("@/lib/purchase/db.server");
        const { alertStaff } = await import("@/lib/purchase/discord.server");
        const supabase = getServiceClient();
        const resource = event?.resource ?? {};
        const related = relatedIds(resource);

        const isRefundLike =
          eventType === "PAYMENT.CAPTURE.REFUNDED" || eventType === "PAYMENT.CAPTURE.REVERSED";
        const captureId = isRefundLike
          ? (related.captureId ?? captureIdFromLinks(resource))
          : resource?.id
            ? String(resource.id)
            : null;

        const payloadMinimal: Record<string, unknown> = {
          status: resource?.status ?? null,
          amount: resource?.amount ?? null,
          invoice_id: resource?.invoice_id ?? null,
          related_order_id: related.orderId,
          related_capture_id: related.captureId,
        };
        if (isRefundLike) {
          payloadMinimal["refund_id"] = resource?.id ? String(resource.id) : null;
          payloadMinimal["total_refunded_amount"] =
            resource?.seller_payable_breakdown?.total_refunded_amount ?? null;
        }

        // Idempotency with retry safety: a duplicate event is only "done" when
        // it has actually been processed; otherwise it is reprocessed.
        const { error: insertError } = await supabase.from("payment_events").insert({
          paypal_event_id: eventId,
          event_type: eventType,
          paypal_capture_id: captureId,
          payload_minimal: payloadMinimal,
          processing_started_at: new Date().toISOString(),
          attempts: 1,
        });

        if (insertError) {
          if (insertError.code !== "23505") {
            console.error("payment_event_insert_failed", { code: insertError.code });
            return new Response("error", { status: 500 });
          }
          const { data: existing } = await supabase
            .from("payment_events")
            .select("processed_at, attempts")
            .eq("paypal_event_id", eventId)
            .maybeSingle();
          if (existing?.processed_at) return new Response("ok", { status: 200 });
          await supabase
            .from("payment_events")
            .update({
              attempts: Number(existing?.attempts ?? 0) + 1,
              processing_started_at: new Date().toISOString(),
            })
            .eq("paypal_event_id", eventId);
        }

        const markProcessed = async () =>
          supabase
            .from("payment_events")
            .update({ processed_at: new Date().toISOString(), last_error_code: null })
            .eq("paypal_event_id", eventId);

        const markRejected = async (reason: string) => {
          await supabase
            .from("payment_events")
            .update({ rejected_at: new Date().toISOString(), reject_reason: reason })
            .eq("paypal_event_id", eventId);
        };

        try {
          if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
            const orderId = resource?.custom_id ? String(resource.custom_id) : null;
            if (!orderId || !captureId) {
              await markRejected("missing_ids");
              await markProcessed();
              return new Response("ok", { status: 200 });
            }
            const { data: order } = await supabase
              .from("purchase_orders")
              .select("id, amount_cents, currency, status, paypal_order_id, paypal_capture_id")
              .eq("id", orderId)
              .maybeSingle();
            if (!order) {
              await markRejected("order_not_found");
              await markProcessed();
              return new Response("ok", { status: 200 });
            }

            const expected = ((order.amount_cents as number) / 100).toFixed(2);
            const problems: string[] = [];
            if (resource?.status !== "COMPLETED") problems.push("status");
            if (resource?.amount?.value !== expected) problems.push("amount");
            if (resource?.amount?.currency_code !== order.currency) problems.push("currency");
            // Do not trust custom_id alone: the capture must belong to our PayPal order.
            if (!related.orderId || related.orderId !== order.paypal_order_id) {
              problems.push("order_id");
            }
            if (order.paypal_capture_id && order.paypal_capture_id !== captureId) {
              problems.push("capture_id");
            }
            if (resource?.final_capture === false) problems.push("final_capture");

            if (problems.length > 0) {
              console.error("webhook_capture_rejected", { eventId, problems });
              await markRejected(problems.join(","));
              await alertStaff(
                `🚨 Webhook PayPal rifiutato (evento \`${eventId}\`, ordine \`${orderId}\`): ${problems.join(", ")}. Nessuna licenza attivata.`,
              );
              // Auditable rejection, no fulfillment. Do not retry a mismatched event.
              await markProcessed();
              return new Response("ok", { status: 200 });
            }

            await supabase
              .from("payment_events")
              .update({ purchase_order_id: orderId })
              .eq("paypal_event_id", eventId);

            const { fulfillOrder } = await import("@/lib/purchase/fulfillment.server");
            await fulfillOrder(orderId, captureId, "paypal_webhook");
          } else if (isRefundLike) {
            const { data: order } = captureId
              ? await supabase
                  .from("purchase_orders")
                  .select("id, amount_cents, currency")
                  .eq("paypal_capture_id", captureId)
                  .maybeSingle()
              : { data: null };

            if (!order) {
              await alertStaff(
                `⚠️ ${eventType} senza ordine associato (evento \`${eventId}\`). Verifica manuale richiesta.`,
              );
              await markRejected("order_not_mapped");
              await markProcessed();
              return new Response("ok", { status: 200 });
            }

            await supabase
              .from("payment_events")
              .update({ purchase_order_id: order.id })
              .eq("paypal_event_id", eventId);

            const { shortId } = await import("@/lib/purchase/crypto.server");
            const { data: assignment } = await supabase
              .from("keyauth_assignments")
              .select("key_last4, status")
              .eq("purchase_order_id", order.id)
              .maybeSingle();
            const keyInfo = assignment?.key_last4
              ? `KeyAuth key \`****${assignment.key_last4}\``
              : "nessuna KeyAuth key ancora assegnata";

            const expected = ((order.amount_cents as number) / 100).toFixed(2);
            let fullRefund = eventType === "PAYMENT.CAPTURE.REVERSED";
            if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
              const totals = resource?.seller_payable_breakdown?.total_refunded_amount;
              fullRefund =
                !!totals &&
                String(totals.currency_code) === String(order.currency) &&
                Number(totals.value) >= Number(expected);
            }

            if (!fullRefund) {
              await alertStaff(
                `⚠️ ${eventType} — ordine \`${shortId(String(order.id))}\`: rimborso parziale o non verificabile (${keyInfo}). Nessuna azione automatica: verifica manuale.`,
              );
            } else {
              await supabase
                .from("purchase_orders")
                .update({
                  status: eventType.endsWith("REFUNDED") ? "refunded" : "reversed",
                  fulfillment_status: "revoked",
                })
                .eq("id", order.id);
              if (assignment) {
                await supabase
                  .from("keyauth_assignments")
                  .update({ status: "revoked" })
                  .eq("purchase_order_id", order.id);
              }
              await supabase.from("license_audit").insert({
                license_id: null,
                action: "order_revoked",
                source: "paypal_webhook",
                metadata_minimal: { event_type: eventType, order_id: order.id },
              });
              await alertStaff(
                [
                  `🚨 ${eventType} — ordine \`${shortId(String(order.id))}\`: **rimborso totale**.`,
                  assignment?.key_last4
                    ? `**Revocare manualmente la KeyAuth key \`****${assignment.key_last4}\` nel pannello KeyAuth.**`
                    : "Nessuna KeyAuth key assegnata: non assegnare nessuna key a questo ordine.",
                ].join("\n"),
              );
            }
          } else if (eventType === "CUSTOMER.DISPUTE.CREATED") {
            const { shortId } = await import("@/lib/purchase/crypto.server");
            const disputedCapture =
              resource?.disputed_transactions?.[0]?.seller_transaction_id ?? captureId;
            const { data: order } = disputedCapture
              ? await supabase
                  .from("purchase_orders")
                  .select("id")
                  .eq("paypal_capture_id", String(disputedCapture))
                  .maybeSingle()
              : { data: null };
            let keyInfo = "ordine non identificato";
            if (order?.id) {
              const { data: assignment } = await supabase
                .from("keyauth_assignments")
                .select("key_last4")
                .eq("purchase_order_id", order.id)
                .maybeSingle();
              keyInfo = `ordine \`${shortId(String(order.id))}\` · ${
                assignment?.key_last4
                  ? `KeyAuth key \`****${assignment.key_last4}\``
                  : "nessuna key assegnata"
              }`;
            }
            await alertStaff(
              `⚠️ Disputa PayPal aperta (evento \`${eventId}\`) — ${keyInfo}. Nessuna revoca automatica: valutare la revoca manuale nel pannello KeyAuth.`,
            );
          }


          await markProcessed();
        } catch (err) {
          const code = err instanceof Error ? err.message : "unknown";
          console.error("webhook_processing_error", { eventType, code });
          await supabase
            .from("payment_events")
            .update({ last_error_code: code })
            .eq("paypal_event_id", eventId);
          // processed_at stays NULL so the PayPal retry reprocesses the event.
          return new Response("error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
