// Server-only order creation / lookup.

import { generateCheckoutToken, sha256Hex } from "./crypto.server";
import { getServiceClient } from "./db.server";
import type { Locale } from "./discord-copy.server";
import { CURRENCY, priceCents, type Days, type Plan } from "./pricing";

export const CHECKOUT_TTL_MINUTES = 30;

/**
 * Logically cancels every still-unpaid order of a ticket so old checkout links
 * stop being payable when the buyer changes plan or duration. Paid orders and
 * any other terminal status are never touched.
 */
export async function cancelPendingOrdersForChannel(channelId: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("discord_ticket_channel_id", channelId)
    .in("status", ["created", "awaiting_payment"]);
  if (error) console.error("order_cancel_failed", { code: error.code });
}

export async function createOrder(params: {
  discordUserId: string;
  ticketChannelId: string | null;
  plan: Plan;
  days: Days;
  locale: Locale;
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
      locale: params.locale,
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
      "id, plan, days, amount_cents, currency, status, checkout_expires_at, paypal_order_id, discord_ticket_channel_id, locale",
    )
    .eq("checkout_token_hash", tokenHash)
    .maybeSingle();
  return data ?? null;
}
