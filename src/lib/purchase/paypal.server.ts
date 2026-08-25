// Server-only PayPal REST helpers.

export function paypalHost(): string {
  const env = (process.env["PAYPAL_ENV"] ?? "sandbox").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function accessToken(): Promise<string> {
  const id = process.env["PAYPAL_CLIENT_ID"];
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!id || !secret) throw new Error("paypal_config_missing");
  const res = await fetch(`${paypalHost()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("paypal_auth_failed");
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("paypal_auth_failed");
  return json.access_token;
}

async function paypalFetch(
  path: string,
  init: { method: string; body?: unknown; requestId?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ status: number; json: any }> {
  const token = await accessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId;
  const res = await fetch(`${paypalHost()}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? null : JSON.stringify(init.body),
  });
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

export async function createPaypalOrder(params: {
  orderId: string;
  invoiceId: string;
  amountCents: number;
  currency: string;
  itemName: string;
}) {
  const value = (params.amountCents / 100).toFixed(2);
  return paypalFetch("/v2/checkout/orders", {
    method: "POST",
    requestId: `create-${params.orderId}`,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: params.orderId,
          invoice_id: params.invoiceId,
          description: params.itemName,
          amount: { currency_code: params.currency, value },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "Aron Mod",
      },
    },
  });
}

export async function getPaypalOrder(paypalOrderId: string) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
    method: "GET",
  });
}

export async function capturePaypalOrder(paypalOrderId: string, orderId: string) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    requestId: `capture-${orderId}`,
    body: {},
  });
}

/**
 * Verifies a PayPal webhook. PayPal requires `webhook_event` to be posted back
 * byte-for-byte as received, so the raw body is spliced into the envelope
 * instead of being parsed and re-serialized.
 */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env["PAYPAL_WEBHOOK_ID"];
  if (!webhookId) return false;
  const required = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ].map((h) => headers.get(h));
  if (required.some((v) => !v)) return false;

  // Only guard against malformed payloads; the original bytes are still sent.
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object") return false;
  } catch {
    return false;
  }

  const envelope =
    "{" +
    [
      `"auth_algo":${JSON.stringify(required[0])}`,
      `"cert_url":${JSON.stringify(required[1])}`,
      `"transmission_id":${JSON.stringify(required[2])}`,
      `"transmission_sig":${JSON.stringify(required[3])}`,
      `"transmission_time":${JSON.stringify(required[4])}`,
      `"webhook_id":${JSON.stringify(webhookId)}`,
      `"webhook_event":${rawBody}`,
    ].join(",") +
    "}";

  const token = await accessToken();
  const res = await fetch(`${paypalHost()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: envelope,
  });
  if (res.status !== 200) return false;
  const json = (await res.json().catch(() => null)) as { verification_status?: string } | null;
  return json?.verification_status === "SUCCESS";
}

