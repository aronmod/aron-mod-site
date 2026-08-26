// Server-only Discord REST + interaction signature verification.

import { t, type Locale } from "./discord-copy.server";
import { priceCents } from "./pricing";

const API = "https://discord.com/api/v10";

function botToken(): string {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) throw new Error("discord_config_missing");
  return token;
}

export async function discordFetch(path: string, init: { method: string; body?: unknown }) {
  const res = await fetch(`${API}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bot ${botToken()}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? null : JSON.stringify(init.body),
  });
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    console.error("discord_api_error", { path, status: res.status });
  }
  return { ok: res.ok, status: res.status, json };
}

export async function sendChannelMessage(channelId: string, body: unknown) {
  return discordFetch(`/channels/${channelId}/messages`, { method: "POST", body });
}

export async function editChannelMessage(channelId: string, messageId: string, body: unknown) {
  return discordFetch(`/channels/${channelId}/messages/${messageId}`, { method: "PATCH", body });
}

export async function deleteChannelMessage(channelId: string, messageId: string) {
  return discordFetch(`/channels/${channelId}/messages/${messageId}`, { method: "DELETE" });
}

export async function getDiscordChannel(channelId: string) {
  return discordFetch(`/channels/${channelId}`, { method: "GET" });
}

export async function addCustomerRole(userId: string) {
  const guildId = process.env["DISCORD_GUILD_ID"];
  const roleId = process.env["DISCORD_CUSTOMER_ROLE_ID"];
  if (!guildId || !roleId) return;
  await discordFetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, { method: "PUT" });
}

export async function alertStaff(content: string) {
  const channelId = process.env["DISCORD_STAFF_ALERT_CHANNEL_ID"];
  if (!channelId) return;
  await sendChannelMessage(channelId, { content });
}

/**
 * Finds an existing open ticket channel for a user, or creates a private one.
 * The locale comes from the entry point (IT / EN panel) and decides the category.
 */
export async function ensureTicketChannel(userId: string, locale: Locale): Promise<string | null> {
  const guildId = process.env["DISCORD_GUILD_ID"];
  const itCategory = process.env["DISCORD_TICKET_CATEGORY_ID"];
  const enCategory = process.env["DISCORD_TICKET_CATEGORY_ID_EN"];
  const categoryId = locale === "it" ? itCategory : enCategory;
  if (!guildId || !categoryId) throw new Error("discord_config_missing");

  const topicMarker = `aron-order:${userId}`;
  const existing = await discordFetch(`/guilds/${guildId}/channels`, { method: "GET" });
  if (Array.isArray(existing.json)) {
    const found = existing.json.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) =>
        c?.parent_id === categoryId &&
        typeof c?.topic === "string" &&
        c.topic.includes(topicMarker),
    );
    if (found?.id) return String(found.id);
  }

  const overwrites: Array<Record<string, unknown>> = [
    { id: guildId, type: 0, deny: "1024" }, // @everyone: VIEW_CHANNEL denied
    { id: userId, type: 1, allow: "3072" }, // buyer: view + send
  ];
  const staffRoleId = process.env["DISCORD_STAFF_ROLE_ID"];
  if (staffRoleId) overwrites.push({ id: staffRoleId, type: 0, allow: "3072" });
  const appId = process.env["DISCORD_APPLICATION_ID"];
  if (appId) overwrites.push({ id: appId, type: 1, allow: "3072" });

  const created = await discordFetch(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: {
      name: `${locale === "it" ? "acquisto" : "order"}-${userId.slice(-4)}`,
      type: 0,
      parent_id: categoryId,
      topic: `Aron Mod purchase ticket · locale:${locale} · ${topicMarker}`,
      permission_overwrites: overwrites,
    },
  });
  return created.json?.id ? String(created.json.id) : null;
}

/** Compact price label for buttons: "12 €" instead of "12,00 €". */
function shortEur(cents: number): string {
  const value = cents / 100;
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
  return `${text} €`;
}

/** Invisible spacer line: renders as vertical breathing room, shows no glyph. */
const SPACER = "\u200B";

/**
 * The persistent plan panel: header + plan buttons only, one button per action
 * row so they are never glued together. The selected plan turns green.
 */
export function panelMessage(
  locale: Locale,
  userId: string,
  selectedPlan: "base" | "plus" | null = null,
) {
  const c = t(locale);
  const lines = [c.welcome(userId), c.panelTitle, "", c.choosePlan, SPACER];

  const style = (plan: "base" | "plus") => (selectedPlan === plan ? 3 : 2);

  const rows: Array<Record<string, unknown>> = [
    {
      type: 1,
      components: [
        { type: 2, style: style("base"), label: c.planBase, custom_id: "aron_plan_base" },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: style("plus"), label: c.planPlus, custom_id: "aron_plan_plus" },
      ],
    },
  ];

  return { content: lines.join("\n"), components: rows };
}

/**
 * The single temporary duration message shown under the plan panel. Changing
 * plan only edits this message (new prices + custom ids), never adds one.
 */
export function durationMessage(
  locale: Locale,
  plan: "base" | "plus",
  selectedDays: 15 | 30 | null = null,
) {
  const c = t(locale);
  const label15 = `${c.days15} — ${shortEur(priceCents(plan, 15))}`;
  const label30 = `${c.days30} — ${shortEur(priceCents(plan, 30))}`;
  const style = (days: 15 | 30) => (selectedDays === days ? 3 : 2);
  return {
    content: [SPACER, c.chooseDuration, SPACER].join("\n"),
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: style(15), label: label15, custom_id: `aron_days_${plan}_15` },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, style: style(30), label: label30, custom_id: `aron_days_${plan}_30` },
        ],
      },
    ],
  };
}

/** The one message left in the ticket after the duration is chosen. */
export function finalOrderMessage(
  locale: Locale,
  userId: string,
  ref: string,
  plan: "base" | "plus",
  days: 15 | 30,
  amountCents: number,
  url: string,
) {
  const c = t(locale);
  return {
    content: [
      c.welcome(userId),
      c.panelTitle,
      "",
      c.orderRef(ref),
      "",
      c.orderPlanLine(plan, days),
      c.orderTotalLine(amountCents),
      "",
      SPACER,
    ].join("\n"),
    components: payButton(locale, url),
  };
}

/** Discord link buttons are always style 5; the label is a plain PAGA / PAY. */
export function payButton(locale: Locale, url: string) {
  return [{ type: 1, components: [{ type: 2, style: 5, label: t(locale).pay, url }] }];
}

export function linkButton(label: string, url: string) {
  return [{ type: 1, components: [{ type: 2, style: 5, label, url }] }];
}

/** Staff-only controls. Visibility is cosmetic: authorization is enforced server-side. */
export function staffKeyButtons(orderId: string, locale: Locale = "it") {
  const c = t(locale);
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 1,
          label: c.staffAssign,
          custom_id: `aron_assign_key_${orderId}`,
        },
        {
          type: 2,
          style: 2,
          label: c.staffRetry,
          custom_id: `aron_retry_key_delivery_${orderId}`,
        },
      ],
    },
  ];
}

/**
 * Shown instead of `staffKeyButtons` when PayPal did not report full seller
 * protection. Authorization for the approval is enforced server-side.
 */
export function reviewButtons(orderId: string, locale: Locale = "it") {
  const c = t(locale);
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: c.staffApprove,
          custom_id: `aron_approve_delivery_${orderId}`,
        },
      ],
    },
  ];
}

/** Discord modal asking staff to paste the key generated manually in KeyAuth. */
export function keyAuthModal(orderId: string, locale: Locale = "it") {
  const c = t(locale);
  return {
    type: 9,
    data: {
      custom_id: `aron_key_modal_${orderId}`,
      title: c.modalTitle,
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "keyauth_key",
              style: 1,
              label: c.modalLabel,
              min_length: 8,
              max_length: 128,
              required: true,
              placeholder: c.modalPlaceholder,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Server-side staff authorization. Requires DISCORD_STAFF_ROLE_ID to be configured:
 * there is no owner/username fallback.
 */
export function isStaffInteraction(body: unknown): boolean {
  const staffRoleId = process.env["DISCORD_STAFF_ROLE_ID"];
  if (!staffRoleId) return false;
  const roles = (body as { member?: { roles?: unknown } } | null)?.member?.roles;
  return Array.isArray(roles) && roles.some((r) => String(r) === staffRoleId);
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Verifies X-Signature-Ed25519 / X-Signature-Timestamp against DISCORD_PUBLIC_KEY. */
export async function verifyDiscordSignature(
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
): Promise<boolean> {
  const publicKey = process.env["DISCORD_PUBLIC_KEY"];
  if (!publicKey || !signature || !timestamp) return false;
  if (!/^[0-9a-fA-F]+$/.test(signature) || signature.length !== 128) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(publicKey) as unknown as ArrayBuffer,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      hexToBytes(signature) as unknown as ArrayBuffer,
      new TextEncoder().encode(timestamp + rawBody) as unknown as ArrayBuffer,
    );
  } catch {
    console.error("discord_signature_verify_failed");
    return false;
  }
}

/**
 * Interaction follow-up REST calls. These use the interaction token (not the
 * bot token) and are the only way to finish work after a deferred ACK.
 */
async function interactionFetch(path: string, method: string, body: unknown) {
  const appId = process.env["DISCORD_APPLICATION_ID"];
  if (!appId) throw new Error("discord_config_missing");
  const res = await fetch(`${API}${path.replace("{app}", appId)}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? null : JSON.stringify(body),
  });
  if (!res.ok) console.error("discord_interaction_followup_error", { path, status: res.status });
  return { ok: res.ok, status: res.status };
}

/** Replaces the deferred ACK (or the component's own message) with real content. */
export async function editOriginalInteraction(token: string, body: unknown) {
  return interactionFetch(`/webhooks/{app}/${token}/messages/@original`, "PATCH", body);
}

/** Sends an additional (ephemeral when flags: 64) message for the interaction. */
export async function followupInteraction(token: string, body: unknown) {
  return interactionFetch(`/webhooks/{app}/${token}`, "POST", body);
}
