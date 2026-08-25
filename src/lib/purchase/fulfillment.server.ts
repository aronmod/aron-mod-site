// Server-only, idempotent payment finalization + manual KeyAuth key delivery.
//
// This project is NOT the license authority: KeyAuth is. Payment fulfillment only
// marks the order paid and asks staff to assign a manually generated KeyAuth key.
// When PayPal does not report full seller protection, the order lands in
// `review_required` and a staff approval is needed before the key can be assigned.

import { decryptSecretValue, shortId } from "./crypto.server";
import { getServiceClient } from "./db.server";
import {
  addCustomerRole,
  alertStaff,
  reviewButtons,
  sendChannelMessage,
  staffKeyButtons,
} from "./discord.server";
import { formatEur } from "./pricing";
import type { RiskOutcome } from "./risk.server";

export type FulfillResult =
  | { status: "paid"; fulfillment: "ready" | "review_required" }
  | { status: "already_processed" }
  | { status: "order_not_found" };

/** Human-readable, non-sensitive cross-reference between our order and PayPal. */
function orderRefLines(orderId: string, captureId: string | null): string[] {
  return [
    `Ordine Aron: \`${shortId(orderId)}\``,
    `PayPal Capture: \`${captureId && captureId.length > 0 ? captureId : "n/d"}\``,
  ];
}

/** Compact one-line reference for staff alerts. */
function orderRefInline(orderId: string, captureId: string | null): string {
  return `Ordine Aron \`${shortId(orderId)}\` · PayPal Capture \`${captureId && captureId.length > 0 ? captureId : "n/d"}\``;
}

function paidMessage(
  orderId: string,
  captureId: string,
  plan: string,
  days: number,
  amountCents: number,
  userId: string | null,
): string {
  return [
    userId ? `<@${userId}>` : "",
    "✅ **Pagamento confermato / Payment confirmed**",
    `Piano / Plan: **${String(plan).toUpperCase()}** · ${days} giorni / days · ${formatEur(amountCents)}`,
    ...orderRefLines(orderId, captureId),
    "",
    "🔑 La KeyAuth key verrà assegnata dallo staff in questo ticket.",
    "_Your KeyAuth key will be assigned by the staff in this ticket._",
  ]
    .filter(Boolean)
    .join("\n");
}

function reviewMessage(
  orderId: string,
  captureId: string,
  plan: string,
  days: number,
  amountCents: number,
  userId: string | null,
): string {
  return [
    userId ? `<@${userId}>` : "",
    "✅ **Pagamento confermato / Payment confirmed**",
    `Piano / Plan: **${String(plan).toUpperCase()}** · ${days} giorni / days · ${formatEur(amountCents)}`,
    ...orderRefLines(orderId, captureId),
    "",
    "🕵️ **Verifica manuale in corso** — questo pagamento richiede una revisione di sicurezza prima della consegna della KeyAuth key. Nessuna azione richiesta da parte tua: lo staff completerà il controllo al più presto.",
    "_🕵️ **Manual review in progress** — this payment requires a security review before the KeyAuth key is delivered. No action needed from you: the staff will complete the check shortly._",
  ]
    .filter(Boolean)
    .join("\n");
}

function keyMessage(plan: string, days: number, plaintextKey: string, userId: string | null) {
  return [
    userId ? `<@${userId}>` : "",
    "🔑 **KeyAuth key assegnata / KeyAuth key assigned**",
    `Piano / Plan: **${String(plan).toUpperCase()}**`,
    `Durata / Duration: **${days} giorni / days**`,
    `\`\`\`${plaintextKey}\`\`\``,
    "Salvala ora. La key è gestita da KeyAuth.",
    "_Save it now. The key is managed by KeyAuth._",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Confirms a verified payment exactly once. No license key is generated here and
 * no row in `licenses` is created or extended — KeyAuth remains the sole authority.
 * `risk` comes from PayPal's capture (server-side), never from the client.
 */
export async function fulfillOrder(
  orderId: string,
  captureId: string,
  source: string,
  risk: RiskOutcome,
): Promise<FulfillResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc("finalize_paid_order_reviewed", {
    _order_id: orderId,
    _capture_id: captureId,
    _source: source,
    _risk_status: risk.status,
    _risk_reason: risk.reason,
    _needs_review: risk.needsReview,
  });
  if (error) {
    console.error("fulfillment_rpc_error", { orderId, code: error.code });
    throw new Error("fulfillment_failed");
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.result === "order_not_found") return { status: "order_not_found" };
  if (row.result === "already_processed") return { status: "already_processed" };

  const channelId = row.ticket_channel_id ? String(row.ticket_channel_id) : null;
  const userId = row.discord_user_id ? String(row.discord_user_id) : null;
  const needsReview = String(row.fulfillment_status) === "review_required";

  if (channelId) {
    const res = await sendChannelMessage(channelId, {
      content: (needsReview ? reviewMessage : paidMessage)(
        orderId,
        captureId,
        String(row.plan),
        Number(row.days),
        Number(row.amount_cents),
        userId,
      ),
      components: needsReview ? reviewButtons(orderId) : staffKeyButtons(orderId),
    });
    if (!res.ok) {
      await alertStaff(
        `⚠️ Pagamento confermato ma messaggio non inviato nel ticket. ${orderRefInline(orderId, captureId)}. Assegnare manualmente la KeyAuth key.`,
      );
    }
  } else {
    await alertStaff(
      `⚠️ Pagamento confermato senza canale ticket. ${orderRefInline(orderId, captureId)}. Contattare il cliente manualmente.`,
    );
  }

  if (needsReview) {
    await alertStaff(
      `🕵️ ${orderRefInline(orderId, captureId)} in **revisione manuale** — seller protection PayPal: \`${risk.status}\`${risk.reason ? ` (\`${risk.reason}\`)` : ""}. Approvare la consegna nel ticket prima di assegnare la KeyAuth key.`,
    );
  }

  if (!needsReview && userId) await addCustomerRole(userId);

  return { status: "paid", fulfillment: needsReview ? "review_required" : "ready" };
}

export type DeliveryResult =
  | { status: "delivered" }
  | { status: "nothing_pending" }
  | { status: "no_channel" }
  | { status: "failed" };

/**
 * Delivers the pending, AES-GCM encrypted KeyAuth key to the buyer's ticket and
 * only then marks it delivered, wiping the ciphertext. On failure the row stays
 * pending so staff can retry without pasting the key again.
 */
export async function deliverPendingKey(orderId: string): Promise<DeliveryResult> {
  const supabase = getServiceClient();

  const { data: delivery } = await supabase
    .from("license_deliveries")
    .select("id, ciphertext, iv, discord_ticket_channel_id, attempts")
    .eq("purchase_order_id", orderId)
    .eq("status", "pending")
    .maybeSingle();
  if (!delivery || !delivery.ciphertext || !delivery.iv) return { status: "nothing_pending" };

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("discord_user_id, discord_ticket_channel_id, plan, days")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { status: "nothing_pending" };

  const channelId =
    (delivery.discord_ticket_channel_id as string | null) ??
    (order.discord_ticket_channel_id as string | null);

  const failDelivery = async (code: string) => {
    await supabase
      .from("license_deliveries")
      .update({ attempts: Number(delivery.attempts ?? 0) + 1, last_error_code: code })
      .eq("id", delivery.id);
  };

  if (!channelId) {
    await failDelivery("no_channel");
    await alertStaff(
      `⚠️ KeyAuth key in attesa di consegna: l'ordine \`${shortId(orderId)}\` non ha un canale ticket.`,
    );
    return { status: "no_channel" };
  }

  let plaintextKey: string;
  try {
    plaintextKey = await decryptSecretValue(String(delivery.ciphertext), String(delivery.iv));
  } catch {
    await failDelivery("decrypt_failed");
    return { status: "failed" };
  }

  const res = await sendChannelMessage(channelId, {
    content: keyMessage(
      String(order.plan),
      Number(order.days),
      plaintextKey,
      order.discord_user_id ? String(order.discord_user_id) : null,
    ),
  });
  if (!res.ok) {
    await failDelivery(`discord_${res.status}`);
    return { status: "failed" };
  }

  const now = new Date().toISOString();
  await supabase
    .from("license_deliveries")
    .update({
      status: "delivered",
      ciphertext: null,
      iv: null,
      delivered_at: now,
      attempts: Number(delivery.attempts ?? 0) + 1,
      last_error_code: null,
    })
    .eq("id", delivery.id);
  await supabase
    .from("keyauth_assignments")
    .update({ status: "delivered", delivered_at: now })
    .eq("purchase_order_id", orderId);
  await supabase
    .from("purchase_orders")
    .update({ fulfillment_status: "delivered" })
    .eq("id", orderId);
  if (order.discord_user_id) await addCustomerRole(String(order.discord_user_id));

  return { status: "delivered" };
}
