// Server-only Discord REST + interaction signature verification.

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

/** Finds an existing open ticket channel for a user, or creates a private one. */
export async function ensureTicketChannel(userId: string): Promise<string | null> {
  const guildId = process.env["DISCORD_GUILD_ID"];
  const categoryId = process.env["DISCORD_TICKET_CATEGORY_ID"];
  if (!guildId || !categoryId) throw new Error("discord_config_missing");

  const topicMarker = `aron-order:${userId}`;
  const existing = await discordFetch(`/guilds/${guildId}/channels`, { method: "GET" });
  if (Array.isArray(existing.json)) {
    const found = existing.json.find(
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
      name: `acquisto-${userId.slice(-4)}`,
      type: 0,
      parent_id: categoryId,
      topic: `Aron Mod purchase ticket · ${topicMarker}`,
      permission_overwrites: overwrites,
    },
  });
  return created.json?.id ? String(created.json.id) : null;
}

export function planButtons() {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "BASE", custom_id: "aron_plan_base" },
        { type: 2, style: 3, label: "PLUS", custom_id: "aron_plan_plus" },
      ],
    },
  ];
}

export function daysButtons(plan: "base" | "plus") {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "15 giorni / days", custom_id: `aron_days_${plan}_15` },
        { type: 2, style: 1, label: "30 giorni / days", custom_id: `aron_days_${plan}_30` },
      ],
    },
  ];
}

export function linkButton(label: string, url: string) {
  return [{ type: 1, components: [{ type: 2, style: 5, label, url }] }];
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
