import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/paypal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyWebhookSignature } = await import("@/lib/purchase/paypal.server");
        const verified = await verifyWebhookSignature(request.headers, raw);
        if (!verified) return new Response("invalid signature", { status: 401 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const supabase = getServiceClient();
        const resource = event?.resource ?? {};
        const captureId = resource?.id ? String(resource.id) : null;
        const orderId: string | null = resource?.custom_id ? String(resource.custom_id) : null;

        const { error: insertError } = await supabase.from("payment_events").insert({
          paypal_event_id: eventId,
          event_type: eventType,
          paypal_capture_id: captureId,
          purchase_order_id: orderId,
          payload_minimal: {
            status: resource?.status ?? null,
            amount: resource?.amount ?? null,
            invoice_id: resource?.invoice_id ?? null,
          },
        });
        // Duplicate event id => already handled (idempotent).
        if (insertError) {
          if (insertError.code === "23505") return new Response("ok", { status: 200 });
          console.error("payment_event_insert_failed", { code: insertError.code });
          return new Response("error", { status: 500 });
        }

        const { alertStaff } = await import("@/lib/purchase/discord.server");

        try {
          if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
            if (!orderId || !captureId) return new Response("ok", { status: 200 });
            const { data: order } = await supabase
              .from("purchase_orders")
              .select("id, amount_cents, currency, status, paypal_order_id")
              .eq("id", orderId)
              .maybeSingle();
            if (!order) return new Response("ok", { status: 200 });

            const expected = ((order.amount_cents as number) / 100).toFixed(2);
            const amountOk =
              resource?.amount?.value === expected &&
              resource?.amount?.currency_code === order.currency &&
              resource?.status === "COMPLETED";
            if (!amountOk) {
              console.error("webhook_amount_mismatch", { eventId });
              await alertStaff(
                `⚠️ Webhook PayPal con importo non corrispondente (evento ${eventId}).`,
              );
              return new Response("ok", { status: 200 });
            }
            const { fulfillOrder } = await import("@/lib/purchase/fulfillment.server");
            await fulfillOrder(orderId, captureId, "paypal_webhook");
          } else if (
            eventType === "PAYMENT.CAPTURE.REFUNDED" ||
            eventType === "PAYMENT.CAPTURE.REVERSED"
          ) {
            const lookup = supabase
              .from("purchase_orders")
              .select("id, license_id, discord_user_id");
            const { data: order } = orderId
              ? await lookup.eq("id", orderId).maybeSingle()
              : await lookup.eq("paypal_capture_id", captureId ?? "").maybeSingle();
            if (order) {
              await supabase
                .from("purchase_orders")
                .update({ status: eventType.endsWith("REFUNDED") ? "refunded" : "reversed" })
                .eq("id", order.id);
              if (order.license_id) {
                await supabase
                  .from("licenses")
                  .update({ status: "suspended" })
                  .eq("id", order.license_id);
                await supabase.from("license_audit").insert({
                  license_id: order.license_id,
                  action: "license_suspended",
                  source: "paypal_webhook",
                  metadata_minimal: { event_type: eventType },
                });
              }
              await alertStaff(
                `🚨 ${eventType} — ordine \`${order.id}\`. Licenza sospesa automaticamente.`,
              );
            }
          } else if (eventType === "CUSTOMER.DISPUTE.CREATED") {
            await alertStaff(
              `⚠️ Disputa PayPal aperta (evento ${eventId}). Nessuna revoca automatica: verificare manualmente.`,
            );
          }

          await supabase
            .from("payment_events")
            .update({ processed_at: new Date().toISOString() })
            .eq("paypal_event_id", eventId);
        } catch (err) {
          console.error("webhook_processing_error", {
            eventType,
            message: err instanceof Error ? err.message : "unknown",
          });
          return new Response("error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
