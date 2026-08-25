// Server-only order creation / lookup.

import { generateCheckoutToken, sha256Hex } from "./crypto.server";
import { getServiceClient } from "./db.server";
import { CURRENCY, priceCents, type Days, type Plan } from "./pricing";

export const CHECKOUT_TTL_MINUTES = 30;

export async function createOrder(params: {
  discordUserId: string;
  ticketChannelId: string | null;
  plan: Plan;
  days: Days;
}) {
  const supabase = getServiceClient();
  const token = generateCheckoutToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      discord_user_id: params.discordUserId,
      discord_ticket_channel_id: params.ticketChannelId,
      plan: params.plan,
      days: params.days,
      amount_cents: priceCents(params.plan, params.days),
      currency: CURRENCY,
      status: "awaiting_payment",
      checkout_token_hash: tokenHash,
      checkout_expires_at: expiresAt,
    })
    .select("id, amount_cents, checkout_expires_at")
    .single();

  if (error || !data) {
    console.error("order_create_failed", { code: error?.code });
    throw new Error("order_create_failed");
  }
  return { token, id: String(data.id), amountCents: data.amount_cents as number, expiresAt };
}

export async function getOrderByToken(token: string) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return null;
  const supabase = getServiceClient();
  const tokenHash = await sha256Hex(token);
  const { data } = await supabase
    .from("purchase_orders")
    .select(
      "id, plan, days, amount_cents, currency, status, checkout_expires_at, paypal_order_id, discord_ticket_channel_id",
    )
    .eq("checkout_token_hash", tokenHash)
    .maybeSingle();
  return data ?? null;
}
