// Server-only bridge between the website selection and the existing Discord
// purchase pipeline. Identity always comes from OAuth, ticket and price always
// from the server: the client can never influence amount, currency or channel.

import { shortId } from "./crypto.server";
import * as discord from "./discord.server";
import type { Locale } from "./discord-copy.server";
import { cancelPendingOrdersForChannel, checkoutUrlFor, createOrder } from "./orders.server";
import type { Days, Plan } from "./pricing";
import { getTicket, updateTicket, upsertTicket } from "./tickets.server";

/**
 * Creates (or reuses) the buyer's private ticket in the category matching the
 * website locale, creates the order server-side and posts the same final order
 * summary used by the Discord-native flow. Returns the checkout URL.
 */
export async function createSiteOrderAndTicket(params: {
  discordUserId: string;
  plan: Plan;
  days: Days;
  locale: Locale;
  requestUrl: string;
}): Promise<{ checkoutUrl: string; channelId: string } | null> {
  const { discordUserId, plan, days, locale } = params;

  // ensureTicketChannel only ever looks inside the category of this locale, so a
  // ticket in the opposite language is never reused.
  const channelId = await discord.ensureTicketChannel(discordUserId, locale);
  if (!channelId) return null;

  const existing = await getTicket(channelId);
  await upsertTicket({ channelId, discordUserId, locale });

  // The website flow skips plan/duration selection: clean up any leftover panel
  // or duration message so the ticket shows exactly one active order summary.
  if (existing?.panelMessageId) {
    await discord.deleteChannelMessage(channelId, existing.panelMessageId);
  }
  if (existing?.summaryMessageId && existing.summaryMessageId !== existing.panelMessageId) {
    await discord.deleteChannelMessage(channelId, existing.summaryMessageId);
  }

  await cancelPendingOrdersForChannel(channelId);

  const order = await createOrder({
    discordUserId,
    ticketChannelId: channelId,
    plan,
    days,
    locale,
  });
  const checkoutUrl = checkoutUrlFor(order.token, params.requestUrl);

  const final = discord.finalOrderMessage(
    locale,
    discordUserId,
    shortId(order.id),
    plan,
    days,
    order.amountCents,
    checkoutUrl,
  );
  const sent = await discord.sendChannelMessage(channelId, final);

  await updateTicket(channelId, {
    panelMessageId: sent.json?.id ? String(sent.json.id) : null,
    summaryMessageId: null,
    selectedPlan: plan,
    selectedDays: days,
  });

  return { checkoutUrl, channelId };
}
