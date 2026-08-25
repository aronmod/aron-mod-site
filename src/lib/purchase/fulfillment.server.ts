// Server-only, idempotent fulfillment shared by the capture path and the webhook.

import {
  decryptSecretValue,
  encryptSecretValue,
  generateLicenseKey,
  last4,
  sha256Hex,
  shortId,
} from "./crypto.server";
import { getServiceClient } from "./db.server";
import { addCustomerRole, alertStaff, sendChannelMessage } from "./discord.server";
import { formatEur } from "./pricing";

export type FulfillResult =
  | { status: "fulfilled"; licenseId: string; expiresAt: string; isNew: boolean }
  | { status: "already_processed" }
  | { status: "order_not_found" };

type OrderRow = {
  discord_user_id: string | null;
  discord_ticket_channel_id: string | null;
  plan: string;
  days: number;
  amount_cents: number;
};

function buildMessage(
  orderId: string,
  order: OrderRow,
  expiresAt: string,
  plaintextKey: string | null,
): string {
  const expires = new Date(expiresAt).toLocaleString("it-IT", { timeZone: "UTC" });
  const lines = [
    "✅ **Pagamento confermato / Payment confirmed**",
    `Piano / Plan: **${String(order.plan).toUpperCase()}** · ${order.days} giorni / days · ${formatEur(order.amount_cents)}`,
    `Scadenza / Expires: **${expires} UTC**`,
    `Ordine / Order: \`${shortId(orderId)}\``,
  ];
  if (plaintextKey) {
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
  return lines.join("\n");
}

/**
 * Delivers a pending encrypted license key to the buyer's ticket and only then
 * marks it delivered, wiping the ciphertext. Throws when Discord fails, so the
 * caller can return a non-2xx and let PayPal retry — the key is never lost.
 */
async function deliverPending(orderId: string): Promise<boolean> {
  const supabase = getServiceClient();
  const { data: delivery } = await supabase
    .from("license_deliveries")
    .select("id, ciphertext, iv, discord_ticket_channel_id, attempts")
    .eq("purchase_order_id", orderId)
    .eq("status", "pending")
    .maybeSingle();
  if (!delivery || !delivery.ciphertext || !delivery.iv) return false;

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("discord_user_id, discord_ticket_channel_id, plan, days, amount_cents, license_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return false;

  const { data: license } = await supabase
    .from("licenses")
    .select("expires_at")
    .eq("id", order.license_id as string)
    .maybeSingle();

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
      `⚠️ License key in attesa di consegna: ordine \`${shortId(orderId)}\` non ha un canale ticket.`,
    );
    throw new Error("license_delivery_no_channel");
  }

  let plaintextKey: string;
  try {
    plaintextKey = await decryptSecretValue(String(delivery.ciphertext), String(delivery.iv));
  } catch {
    await failDelivery("decrypt_failed");
    throw new Error("license_delivery_decrypt_failed");
  }

  const res = await sendChannelMessage(channelId, {
    content: buildMessage(
      orderId,
      order as unknown as OrderRow,
      String(license?.expires_at ?? new Date().toISOString()),
      plaintextKey,
    ),
  });
  if (!res.ok) {
    await failDelivery(`discord_${res.status}`);
    throw new Error("license_delivery_failed");
  }

  await supabase
    .from("license_deliveries")
    .update({
      status: "delivered",
      ciphertext: null,
      iv: null,
      delivered_at: new Date().toISOString(),
      attempts: Number(delivery.attempts ?? 0) + 1,
      last_error_code: null,
    })
    .eq("id", delivery.id);
  return true;
}

/**
 * Activates or extends the license for a paid order exactly once.
 * For a new license the plaintext key is stored only AES-GCM encrypted in the
 * delivery outbox (same transaction as the payment finalization) and wiped once
 * the Discord ticket message succeeds.
 */
export async function fulfillOrder(
  orderId: string,
  captureId: string,
  source: string,
): Promise<FulfillResult> {
  const supabase = getServiceClient();
  const plaintextKey = generateLicenseKey();
  const keyHash = await sha256Hex(plaintextKey);
  const encrypted = await encryptSecretValue(plaintextKey);

  const { data, error } = await supabase.rpc("finalize_paid_order", {
    _order_id: orderId,
    _capture_id: captureId,
    _new_key_hash: keyHash,
    _new_key_last4: last4(plaintextKey),
    _source: source,
    _delivery_ciphertext: encrypted.ciphertext,
    _delivery_iv: encrypted.iv,
  });
  if (error) {
    console.error("fulfillment_rpc_error", { orderId, code: error.code });
    throw new Error("fulfillment_failed");
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.result === "order_not_found") return { status: "order_not_found" };

  if (row.result === "already_processed") {
    // Retry path: a previous run may have persisted the key but failed to deliver it.
    await deliverPending(orderId);
    return { status: "already_processed" };
  }

  if (row.is_new_license) {
    await deliverPending(orderId);
  } else {
    const { data: order } = await supabase
      .from("purchase_orders")
      .select("discord_user_id, discord_ticket_channel_id, plan, days, amount_cents")
      .eq("id", orderId)
      .maybeSingle();
    if (order?.discord_ticket_channel_id) {
      const res = await sendChannelMessage(String(order.discord_ticket_channel_id), {
        content: buildMessage(orderId, order as unknown as OrderRow, String(row.expires_at), null),
      });
      if (!res.ok) {
        // No secret at risk on renewals: alert staff instead of blocking the webhook.
        await alertStaff(
          `⚠️ Rinnovo confermato ma messaggio Discord non inviato per ordine \`${shortId(orderId)}\`.`,
        );
      }
    }
  }

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("discord_user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (order?.discord_user_id) await addCustomerRole(String(order.discord_user_id));

  return {
    status: "fulfilled",
    licenseId: String(row.license_id),
    expiresAt: String(row.expires_at),
    isNew: Boolean(row.is_new_license),
  };
}
