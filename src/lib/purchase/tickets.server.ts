// Server-only ticket state: locale + the minimal Discord message ids needed to
// keep exactly one panel and one order summary per ticket.

import { getServiceClient } from "./db.server";
import { normalizeLocale, type Locale } from "./discord-copy.server";
import type { Days, Plan } from "./pricing";

export type TicketState = {
  channelId: string;
  discordUserId: string;
  locale: Locale;
  panelMessageId: string | null;
  summaryMessageId: string | null;
  selectedPlan: Plan | null;
  selectedDays: Days | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toState(row: any): TicketState {
  return {
    channelId: String(row.channel_id),
    discordUserId: String(row.discord_user_id),
    locale: normalizeLocale(row.locale),
    panelMessageId: row.panel_message_id ? String(row.panel_message_id) : null,
    summaryMessageId: row.summary_message_id ? String(row.summary_message_id) : null,
    selectedPlan: (row.selected_plan as Plan | null) ?? null,
    selectedDays: (row.selected_days as Days | null) ?? null,
  };
}

export async function getTicket(channelId: string): Promise<TicketState | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("discord_tickets")
    .select(
      "channel_id, discord_user_id, locale, panel_message_id, summary_message_id, selected_plan, selected_days",
    )
    .eq("channel_id", channelId)
    .maybeSingle();
  return data ? toState(data) : null;
}

export async function upsertTicket(params: {
  channelId: string;
  discordUserId: string;
  locale: Locale;
}): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("discord_tickets").upsert(
    {
      channel_id: params.channelId,
      discord_user_id: params.discordUserId,
      locale: params.locale,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "channel_id" },
  );
}

export async function updateTicket(
  channelId: string,
  patch: {
    panelMessageId?: string | null;
    summaryMessageId?: string | null;
    selectedPlan?: Plan | null;
    selectedDays?: Days | null;
  },
): Promise<void> {
  const supabase = getServiceClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("panelMessageId" in patch) row["panel_message_id"] = patch.panelMessageId;
  if ("summaryMessageId" in patch) row["summary_message_id"] = patch.summaryMessageId;
  if ("selectedPlan" in patch) row["selected_plan"] = patch.selectedPlan;
  if ("selectedDays" in patch) row["selected_days"] = patch.selectedDays;
  await supabase.from("discord_tickets").update(row).eq("channel_id", channelId);
}

/** Locale of a ticket, defaulting to Italian when the ticket is unknown. */
export async function ticketLocale(channelId: string | null | undefined): Promise<Locale> {
  if (!channelId) return "it";
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("discord_tickets")
    .select("locale")
    .eq("channel_id", channelId)
    .maybeSingle();
  if (data?.locale === "it" || data?.locale === "en") return data.locale;

  const itCategory = process.env["DISCORD_TICKET_CATEGORY_ID"];
  const enCategory = process.env["DISCORD_TICKET_CATEGORY_ID_EN"];
  if (!itCategory && !enCategory) return "it";

  try {
    const { getDiscordChannel } = await import("./discord.server");
    const channel = await getDiscordChannel(channelId);
    const parentId = channel.json?.parent_id ? String(channel.json.parent_id) : null;
    if (enCategory && parentId === enCategory) return "en";
    if (itCategory && parentId === itCategory) return "it";
  } catch {
    /* If Discord is unavailable, prefer Italian over accidentally using English. */
  }

  return "it";
}
