// Server-only Discord OAuth2 (authorization code) helpers for the website
// purchase flow: signed anti-CSRF state, code exchange, identity fetch and
// guild join. Access tokens never leave this module and are never logged.

import { hmacSha256Hex, requireSecret } from "./crypto.server";
import { normalizeLocale, type Locale } from "./discord-copy.server";
import { getServiceClient } from "./db.server";
import { isDays, isPlan, type Days, type Plan } from "./pricing";

const OAUTH_API = "https://discord.com/api/v10";
const STATE_TTL_SECONDS = 600; // 10 minutes
export const OAUTH_SCOPES = "identify guilds.join";

export type OauthSelection = { plan: Plan; days: Days; locale: Locale };

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC-signed, short-lived state. Carries only plan/days/locale/prompt/nonce/exp. */
export async function signState(
  selection: OauthSelection,
  prompt: "none" | "consent" = "none",
): Promise<string> {
  const secret = requireSecret("DISCORD_OAUTH_STATE_SECRET");
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  let nonce = "";
  for (const b of nonceBytes) nonce += b.toString(16).padStart(2, "0");
  const payload = b64url(
    JSON.stringify({
      p: selection.plan,
      d: selection.days,
      l: selection.locale,
      r: prompt,
      n: nonce,
      e: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
    }),
  );
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyState(
  state: string | null,
): Promise<(OauthSelection & { nonce: string; prompt: "none" | "consent" }) | null> {
  if (!state || state.length > 512) return null;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const secret = requireSecret("DISCORD_OAUTH_STATE_SECRET");
  const expected = await hmacSha256Hex(secret, payload);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(b64urlDecode(payload)) as Record<string, unknown>;
    const days = Number(parsed["d"]);
    if (!isPlan(parsed["p"]) || !isDays(days)) return null;
    if (typeof parsed["e"] !== "number" || parsed["e"] < Math.floor(Date.now() / 1000)) return null;
    if (typeof parsed["n"] !== "string" || parsed["n"].length < 8) return null;
    return {
      plan: parsed["p"],
      days,
      locale: normalizeLocale(parsed["l"]),
      nonce: parsed["n"],
      prompt: parsed["r"] === "consent" ? "consent" : "none",
    };
  } catch {
    return null;
  }
}


/** Shared rate limiter (service-role RPC). Returns true when the call is allowed. */
export async function allowRequest(
  bucketKey: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { data, error } = await getServiceClient().rpc("bump_rate_limit", {
      _key: bucketKey,
      _limit: limit,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("rate_limit_failed", { code: error.code });
      return true; // never block legitimate buyers on infrastructure errors
    }
    return data !== false;
  } catch {
    return true;
  }
}

/** Anonymized client fingerprint for rate-limit buckets (never stores raw IPs). */
export async function clientFingerprint(request: Request): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return (await hmacSha256Hex(requireSecret("DISCORD_OAUTH_STATE_SECRET"), ip)).slice(0, 32);
}

export function oauthClientId(): string {
  return requireSecret("DISCORD_APPLICATION_ID");
}

/**
 * Public callback URL. In sandbox the stable dev host answers API routes without
 * a Lovable session, so it is used for the OAuth callback.
 *
 * NOTE (production): after the live deploy + Discord Developer Portal config,
 * both the OAuth callback and the checkout will run on https://aronmod.net
 * (i.e. https://aronmod.net/api/public/discord-oauth-callback). The Lovable
 * dev/preview hosts below are intentionally kept for sandbox and must not be
 * removed while PAYPAL_ENV=sandbox.
 */
export function oauthRedirectUri(requestUrl: string): string {
  const DEV_API_ORIGIN = "https://project--1c134ef5-f387-4545-90d6-32fe56e14d6a-dev.lovable.app";
  const base = process.env["PAYPAL_ENV"] === "sandbox" ? DEV_API_ORIGIN : requestUrl;
  return new URL("/api/public/discord-oauth-callback", base).toString();
}

export type OauthPrompt = "none" | "consent";

export function isOauthPrompt(value: unknown): value is OauthPrompt {
  return value === "none" || value === "consent";
}

/**
 * Builds the authorize URL. `prompt=none` lets Discord skip the consent screen
 * for users who already authorized the app; `consent` is only used as fallback
 * when Discord signals that interaction/consent is required.
 */
export function authorizeUrl(
  state: string,
  redirectUri: string,
  prompt: OauthPrompt = "none",
): string {
  const params = new URLSearchParams({
    client_id: oauthClientId(),
    response_type: "code",
    scope: OAUTH_SCOPES,
    redirect_uri: redirectUri,
    state,
    prompt,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}


/** Exchanges the one-time code for a short-lived access token (never logged). */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string } | null> {
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
  if (!clientSecret) throw new Error("discord_client_secret_missing");
  const res = await fetch(`${OAUTH_API}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauthClientId(),
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  if (!res.ok) {
    console.error("discord_oauth_token_failed", { status: res.status });
    return null;
  }
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ? { accessToken: json.access_token } : null;
}

/** Verified Discord identity. The user id is only ever taken from here. */
export async function fetchOauthUserId(accessToken: string): Promise<string | null> {
  const res = await fetch(`${OAUTH_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.error("discord_oauth_user_failed", { status: res.status });
    return null;
  }
  const json = (await res.json()) as { id?: string };
  return json.id && /^\d{5,25}$/.test(String(json.id)) ? String(json.id) : null;
}

/** Best-effort token revocation so no access token survives the request. */
export async function revokeToken(accessToken: string): Promise<void> {
  const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
  if (!clientSecret) return;
  try {
    await fetch(`${OAUTH_API}/oauth2/token/revoke`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: oauthClientId(),
        client_secret: clientSecret,
        token: accessToken,
        token_type_hint: "access_token",
      }).toString(),
    });
  } catch {
    /* revocation is best-effort */
  }
}

/**
 * Adds the user to the guild using the bot token. Already-a-member (204/HTTP 204
 * with empty body) and fresh joins (201) both count as success.
 */
export async function ensureGuildMember(userId: string, accessToken: string): Promise<boolean> {
  const guildId = process.env["DISCORD_GUILD_ID"];
  const botToken = process.env["DISCORD_BOT_TOKEN"];
  if (!guildId || !botToken) throw new Error("discord_config_missing");

  const member = await fetch(`${OAUTH_API}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (member.ok) return true;

  const res = await fetch(`${OAUTH_API}/guilds/${guildId}/members/${userId}`, {
    method: "PUT",
    headers: { Authorization: `Bot ${botToken}`, "content-type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (res.status === 201 || res.status === 204) return true;
  console.error("discord_guild_join_failed", { status: res.status });
  return false;
}
