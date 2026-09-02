// Server-only review business logic. The `reviews` table is deny-by-default:
// only the service-role client reaches it.

import { getServiceClient } from "@/lib/purchase/db.server";

import type { Locale } from "./reviews-copy.server";

export type ReviewRow = {
  id: string;
  discord_user_id: string;
  discord_username: string | null;
  locale: string;
  rating: number;
  body: string;
  status: string;
  created_at: string;
  reviewer_discord_id?: string | null;
  reviewed_at?: string | null;
  public_message_id?: string | null;
};

/** Removes mass mentions, mentions and links before anything is published. */
export function sanitizeReviewBody(input: string): string {
  return input
    .replace(/\r/g, "")
    .replace(/@(everyone|here)/gi, "@\u200b$1")
    .replace(/<@[!&]?\d+>/g, "[mention]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/discord\.gg\/\S+/gi, "[link]")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1000);
}

export function parseRating(raw: string): number | null {
  if (!/^[1-5]$/.test(raw.trim())) return null;
  return Number(raw.trim());
}

/** Reviewer/staff Discord IDs allowed to approve. */
export function approverIds(): string[] {
  const list = process.env["DISCORD_REVIEW_APPROVER_IDS"] ?? "";
  const single = process.env["DISCORD_REVIEW_APPROVER_ID"] ?? "";
  return [...list.split(","), single]
    .map((v) => v.trim())
    .filter((v) => /^\d{5,25}$/.test(v))
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

export function reviewsChannelId(): string | null {
  const id = process.env["DISCORD_REVIEWS_CHANNEL_ID"] ?? "";
  return /^\d{5,25}$/.test(id) ? id : null;
}

/** 3 submissions per 10 minutes per user. */
export async function reviewRateLimitOk(userId: string): Promise<boolean> {
  const { data, error } = await getServiceClient().rpc("bump_rate_limit", {
    _key: `review:${userId}`,
    _limit: 3,
    _window_seconds: 600,
  });
  if (error) return true; // never block on limiter failures
  return data !== false;
}

// This table is added by migration and is intentionally not exposed to the browser.
// Keep this narrow cast until the generated database types are refreshed.
function reviewsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (getServiceClient() as any).from("reviews");
}

export type CreateResult =
  | { status: "created"; review: ReviewRow }
  | { status: "pending_exists" | "approved_exists" | "failed" };

export async function createPendingReview(input: {
  discordUserId: string;
  discordUsername: string | null;
  locale: Locale;
  rating: number;
  body: string;
}): Promise<CreateResult> {
  const table = reviewsTable();
  const { data: existing } = await table
    .select("id, status")
    .eq("discord_user_id", input.discordUserId)
    .in("status", ["pending", "approved"]);

  const rows = Array.isArray(existing) ? existing : [];
  if (rows.some((r) => r.status === "approved")) return { status: "approved_exists" };
  if (rows.some((r) => r.status === "pending")) return { status: "pending_exists" };

  const { data, error } = await table
    .insert({
      discord_user_id: input.discordUserId,
      discord_username: input.discordUsername,
      locale: input.locale,
      rating: input.rating,
      body: input.body,
      status: "pending",
    })
    .select("id, discord_user_id, discord_username, locale, rating, body, status, created_at")
    .maybeSingle();

  if (error || !data) {
    console.error("review_insert_failed", { code: error?.code ?? "unknown" });
    // Unique partial indexes protect against races.
    if (error?.code === "23505") return { status: "pending_exists" };
    return { status: "failed" };
  }
  return { status: "created", review: data as ReviewRow };
}

export async function getReview(id: string): Promise<ReviewRow | null> {
  const { data } = await reviewsTable()
    .select("id, discord_user_id, discord_username, locale, rating, body, status, created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as ReviewRow | null) ?? null;
}

/** Atomic transition: only a still-pending row is updated. */
export async function markReviewed(
  id: string,
  status: "approved" | "rejected",
  reviewerId: string,
): Promise<ReviewRow | null> {
  const { data } = await reviewsTable()
    .update({ status, reviewer_discord_id: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, discord_user_id, discord_username, locale, rating, body, status, created_at")
    .maybeSingle();
  return (data as ReviewRow | null) ?? null;
}

export async function setPublicMessageId(id: string, messageId: string): Promise<void> {
  await reviewsTable().update({ public_message_id: messageId }).eq("id", id);
}
