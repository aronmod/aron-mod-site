import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/) });
const captureSchema = tokenSchema.extend({ paypalOrderId: z.string().min(6).max(64) });

export type CheckoutSummary = {
  state: "ok" | "expired" | "paid" | "not_found" | "cancelled";
  plan?: "base" | "plus";
  days?: 15 | 30;
  amountCents?: number;
  currency?: string;
  orderRef?: string;
  expiresAt?: string;
  paypalClientId?: string;
};

export const getCheckoutSummary = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<CheckoutSummary> => {
    const { getOrderByToken } = await import("./purchase/orders.server");
    const { shortId } = await import("./purchase/crypto.server");
    const order = await getOrderByToken(data.token);
    if (!order) return { state: "not_found" };
    if (order.status === "paid") return { state: "paid", orderRef: shortId(String(order.id)) };
    if (order.status === "cancelled") return { state: "cancelled" };
    if (new Date(order.checkout_expires_at).getTime() < Date.now()) return { state: "expired" };
    return {
      state: "ok",
      plan: order.plan as "base" | "plus",
      days: order.days as 15 | 30,
      amountCents: order.amount_cents as number,
      currency: String(order.currency),
      orderRef: shortId(String(order.id)),
      expiresAt: String(order.checkout_expires_at),
      // Public client id only. PAYPAL_CLIENT_ID stays strictly server-side.
      paypalClientId: process.env["PUBLIC_PAYPAL_CLIENT_ID"] ?? "",

    };
  });

export const startPaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; paypalOrderId?: string; error?: string }> => {
    const { getOrderByToken } = await import("./purchase/orders.server");
    const { getServiceClient } = await import("./purchase/db.server");
    const { createPaypalOrder } = await import("./purchase/paypal.server");
    const { shortId } = await import("./purchase/crypto.server");

    const order = await getOrderByToken(data.token);
    if (!order) return { ok: false, error: "not_found" };
    if (order.status === "paid") return { ok: false, error: "already_paid" };
    if (new Date(order.checkout_expires_at).getTime() < Date.now())
      return { ok: false, error: "expired" };
    if (order.paypal_order_id) return { ok: true, paypalOrderId: String(order.paypal_order_id) };

    const orderId = String(order.id);
    const res = await createPaypalOrder({
      orderId,
      invoiceId: `ARON-${shortId(orderId)}`,
      amountCents: order.amount_cents as number,
      currency: String(order.currency),
      itemName: `Aron Mod ${String(order.plan).toUpperCase()} · ${order.days} giorni`,
    });
    const paypalOrderId = res.json?.id;
    if (!paypalOrderId) {
      console.error("paypal_create_failed", { status: res.status });
      return { ok: false, error: "paypal_error" };
    }
    await getServiceClient()
      .from("purchase_orders")
      .update({ paypal_order_id: paypalOrderId })
      .eq("id", orderId);
    return { ok: true, paypalOrderId: String(paypalOrderId) };
  });

export const finalizePaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => captureSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { getOrderByToken } = await import("./purchase/orders.server");
    const { capturePaypalOrder, getPaypalOrder } = await import("./purchase/paypal.server");
    const { fulfillOrder } = await import("./purchase/fulfillment.server");

    const order = await getOrderByToken(data.token);
    if (!order) return { ok: false, error: "not_found" };
    if (order.status === "paid") return { ok: true };
    if (!order.paypal_order_id || order.paypal_order_id !== data.paypalOrderId) {
      return { ok: false, error: "order_mismatch" };
    }

    const orderId = String(order.id);
    let capture = await capturePaypalOrder(String(order.paypal_order_id), orderId);
    if (capture.status === 422 || capture.status === 400) {
      // Possibly already captured — re-read authoritative state from PayPal.
      capture = await getPaypalOrder(String(order.paypal_order_id));
    }
    const unit = capture.json?.purchase_units?.[0];
    const captureObj = unit?.payments?.captures?.[0];
    const okStatus = capture.json?.status === "COMPLETED" && captureObj?.status === "COMPLETED";
    const amountOk =
      captureObj?.amount?.currency_code === order.currency &&
      captureObj?.amount?.value === ((order.amount_cents as number) / 100).toFixed(2);
    const customOk = (unit?.custom_id ?? captureObj?.custom_id) === orderId;

    if (!okStatus || !amountOk || !customOk) {
      console.error("paypal_capture_not_verified", { status: capture.status });
      return { ok: false, error: "payment_not_completed" };
    }

    await fulfillOrder(orderId, String(captureObj.id), "checkout_capture");
    return { ok: true };
  });
