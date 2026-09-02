// Server-only Discord payload builders + REST helpers for the reviews flow.
// Reuses the existing purchase bot transport: no second bot, no discord.js.

import { discordFetch, sendChannelMessage } from "@/lib/purchase/discord.server";
import { DISCORD_PURPLE } from "@/lib/purchase/discord-theme";

import { rc, type Locale } from "./reviews-copy.server";

export const REVIEW_OPEN_ID = "aron_review_open";
export const REVIEW_MODAL_ID = "aron_review_modal";

/** Opens (or reuses) the DM channel with a user. Returns null when DMs are closed. */
export async function createDmChannel(userId: string): Promise<string | null> {
  const res = await discordFetch("/users/@me/channels", {
    method: "POST",
    body: { recipient_id: userId },
  });
  return res.json?.id ? String(res.json.id) : null;
}

export async function sendDirectMessage(userId: string, body: unknown): Promise<boolean> {
  const channelId = await createDmChannel(userId);
  if (!channelId) return false;
  const res = await sendChannelMessage(channelId, body);
  return res.ok;
}

/** Persistent public panel published by /setup-recensioni. */
export function reviewPanelMessage(locale: Locale) {
  const c = rc(locale);
  return {
    embeds: [
      {
        title: c.panelTitle,
        description: c.panelDescription,
        color: DISCORD_PURPLE,
      },
    ],
    components: [
      {
        type: 1,
        components: [{ type: 2, style: 1, label: c.panelButton, custom_id: REVIEW_OPEN_ID }],
      },
    ],
  };
}

/** Modal with rating (1-5) and free text. */
export function reviewModal(locale: Locale) {
  const c = rc(locale);
  return {
    type: 9,
    data: {
      custom_id: REVIEW_MODAL_ID,
      title: c.modalTitle,
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "review_rating",
              style: 1,
              label: c.modalRating,
              min_length: 1,
              max_length: 1,
              required: true,
              placeholder: c.modalRatingPlaceholder,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "review_body",
              style: 2,
              label: c.modalBody,
              min_length: 20,
              max_length: 1000,
              required: true,
              placeholder: c.modalBodyPlaceholder,
            },
          ],
        },
      ],
    },
  };
}

export function stars(rating: number): string {
  const safe = Math.max(1, Math.min(5, Math.round(rating)));
  return "⭐".repeat(safe) + "☆".repeat(5 - safe);
}

function isoDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Staff-only DM card: identity IS visible here, never in the public post. */
export function reviewerDmCard(
  locale: Locale,
  review: {
    id: string;
    discordUserId: string;
    discordUsername: string | null;
    rating: number;
    body: string;
    createdAt: string;
  },
) {
  const english = locale === "en";
  return {
    embeds: [
      {
        title: english ? "📝 New review awaiting approval" : "📝 Nuova recensione da approvare",
        color: DISCORD_PURPLE,
        description: review.body.slice(0, 1000),
        fields: [
          {
            name: english ? "Author" : "Autore",
            value: `${review.discordUsername ?? "—"} (<@${review.discordUserId}>)`,
            inline: false,
          },
          { name: "Discord ID", value: `\`${review.discordUserId}\``, inline: true },
          {
            name: english ? "Rating" : "Voto",
            value: `${stars(review.rating)} (${review.rating}/5)`,
            inline: true,
          },
          { name: english ? "Date" : "Data", value: isoDate(review.createdAt), inline: true },
          { name: english ? "Language" : "Lingua", value: locale.toUpperCase(), inline: true },
        ],
        footer: { text: `review:${review.id}` },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: english ? "✅ Approve" : "✅ Approva",
            custom_id: `aron_review_approve_${review.id}`,
          },
          {
            type: 2,
            style: 4,
            label: english ? "❌ Reject" : "❌ Rifiuta",
            custom_id: `aron_review_reject_${review.id}`,
          },
        ],
      },
    ],
  };
}

/** Published review cards use blue #2563EB; the main panel stays purple. */
export const REVIEW_BLUE = 0x2563eb;

/** Public, fully anonymous post. No username, no mention, no user ID. */
export function publicReviewMessage(
  locale: Locale,
  review: { rating: number; body: string; createdAt: string },
) {
  const c = rc(locale);
  return {
    embeds: [
      {
        color: REVIEW_BLUE,

        title: stars(review.rating),
        description: review.body,
        footer: {
          text: `${c.publicAnonymous} · ${c.publicApproved} · ${isoDate(review.createdAt)}`,
        },
      },
    ],
    allowed_mentions: { parse: [] },
  };
}

/**
 * Keeps the review panel as the last message of the channel: deletes every
 * existing panel (identified via the `aron_review_open` component) and reposts
 * the same panel content at the bottom. Never throws: callers must not roll
 * back an already published review if this fails.
 */
export async function repositionReviewPanel(
  channelId: string,
  fallbackLocale: Locale,
): Promise<boolean> {
  try {
    const {
      listChannelMessages,
      deleteChannelMessage,
      sendChannelMessage: send,
    } = await import("@/lib/purchase/discord.server");
    const messages = await listChannelMessages(channelId, 100);
    type PanelMessage = {
      id?: string;
      embeds?: unknown[];
      components?: Array<{ components?: Array<{ custom_id?: string }> }>;
    };
    const list = (Array.isArray(messages.json) ? messages.json : []) as PanelMessage[];
    const panels = list.filter((message) =>
      message.components?.some((row) =>
        row.components?.some((component) => component.custom_id === REVIEW_OPEN_ID),
      ),
    );
    const source = panels[0];
    const payload =
      source && Array.isArray(source.embeds) && source.embeds.length > 0
        ? { embeds: source.embeds, components: source.components }
        : reviewPanelMessage(fallbackLocale);

    for (const panel of panels) {
      if (panel.id) await deleteChannelMessage(channelId, panel.id);
    }
    const res = await send(channelId, payload);
    return res.ok;
  } catch (err) {
    console.error("review_panel_reposition_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}
