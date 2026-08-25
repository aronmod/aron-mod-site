// Server-only, idempotent fulfillment shared by the capture path and the webhook.

import { generateLicenseKey, last4, sha256Hex, shortId } from "./crypto.server";
import { getServiceClient } from "./db.server";
import { addCustomerRole, sendChannelMessage } from "./discord.server";
import { formatEur } from "./pricing";

export type FulfillResult =
  | { status: "fulfilled"; licenseId: string; expiresAt: string; isNew: boolean }
  | { status: "already_processed" }
  | { status: "order_not_found" };

/**
 * Activates or extends the license for a paid order exactly once.
 * The plaintext key exists only in this function's scope and is delivered to the
 * buyer's Discord ticket; only its SHA-256 is persisted.
 */
export async function fulfillOrder(
  orderId: string,
  captureId: string,
  source: string,
): Promise<FulfillResult> {
  const supabase = getServiceClient();
  const plaintextKey = generateLicenseKey();
  const keyHash = await sha256Hex(plaintextKey);

  const { data, error } = await supabase.rpc("finalize_paid_order", {
    _order_id: orderId,
    _capture_id: captureId,
    _new_key_hash: keyHash,
    _new_key_last4: last4(plaintextKey),
    _source: source,
  });
  if (error) {
    console.error("fulfillment_rpc_error", { orderId, code: error.code });
    throw new Error("fulfillment_failed");
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.result === "order_not_found") return { status: "order_not_found" };
  if (row.result === "already_processed") return { status: "already_processed" };

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("discord_user_id, discord_ticket_channel_id, plan, days, amount_cents")
    .eq("id", orderId)
    .maybeSingle();

  if (order) {
    const expires = new Date(row.expires_at).toLocaleString("it-IT", { timeZone: "UTC" });
    const planLabel = String(order.plan).toUpperCase();
    const lines = [
      "✅ **Pagamento confermato / Payment confirmed**",
      `Piano / Plan: **${planLabel}** · ${order.days} giorni / days · ${formatEur(order.amount_cents)}`,
      `Scadenza / Expires: **${expires} UTC**`,
      `Ordine / Order: \`${shortId(orderId)}\``,
    ];
    if (row.is_new_license) {
      lines.push(
        "",
        "🔑 La tua license key (mostrata **una sola volta**, salvala ora):",
        `\`\`\`${plaintextKey}\`\`\``,
        "_Your license key is shown only once — store it safely._",
      );
    } else {
      lines.push(
        "",
        "♻️ La tua licenza esistente è stata **estesa**: continua a usare la stessa key.",
        "_Your existing license has been extended: keep using the same key._",
      );
    }
    if (order.discord_ticket_channel_id) {
      await sendChannelMessage(String(order.discord_ticket_channel_id), {
        content: lines.join("\n"),
      });
    }
    if (order.discord_user_id) {
      await addCustomerRole(String(order.discord_user_id));
    }
  }

  return {
    status: "fulfilled",
    licenseId: String(row.license_id),
    expiresAt: String(row.expires_at),
    isNew: Boolean(row.is_new_license),
  };
}
