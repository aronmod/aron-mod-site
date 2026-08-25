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

export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
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

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const { status, json } = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: required[0],
      cert_url: required[1],
      transmission_id: required[2],
      transmission_sig: required[3],
      transmission_time: required[4],
      webhook_id: webhookId,
      webhook_event: event,
    },
  });
  return status === 200 && json?.verification_status === "SUCCESS";
}
