// Server-only crypto helpers. Never import from client code.

const HEX = "0123456789abcdef";

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (const b of bytes) out += HEX[b >> 4] + HEX[b & 15];
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toHex(digest);
}

function randomBase32(length: number): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/** Unpredictable checkout token (URL safe). Only its SHA-256 is stored. */
export function generateCheckoutToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

/** Cryptographically secure license key, shown to the user exactly once. */
export function generateLicenseKey(): string {
  const groups = [0, 1, 2, 3].map(() => randomBase32(5));
  return `ARON-${groups.join("-")}`;
}

export function last4(key: string): string {
  return key.slice(-4);
}

export function shortId(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
}
