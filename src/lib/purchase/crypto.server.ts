// Server-only crypto helpers. Never import from client code.

const HEX = "0123456789abcdef";

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (const b of bytes) out += (HEX[b >> 4] ?? "") + (HEX[b & 15] ?? "");
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
  for (const b of bytes) out += alphabet[b % alphabet.length] ?? "A";
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

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += (HEX[b >> 4] ?? "") + (HEX[b & 15] ?? "");
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Keyed hash — used for HWID and for rate-limit fingerprints. */
export async function hmacSha256Hex(secret: string, input: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(input) as unknown as ArrayBuffer,
  );
  return toHex(sig);
}

export function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name.toLowerCase()}_missing`);
  return value;
}

async function aesKey(): Promise<CryptoKey> {
  const secret = requireSecret("LICENSE_DELIVERY_SECRET");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** AES-GCM encryption for the license key held in the delivery outbox. */
export async function encryptSecretValue(
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const key = await aesKey();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const buf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    key,
    new TextEncoder().encode(plaintext) as unknown as ArrayBuffer,
  );
  return { ciphertext: toHex(buf), iv: bytesToHex(iv) };
}

export async function decryptSecretValue(ciphertext: string, iv: string): Promise<string> {
  const key = await aesKey();
  const buf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBytes(iv) as unknown as ArrayBuffer },
    key,
    hexToBytes(ciphertext) as unknown as ArrayBuffer,
  );
  return new TextDecoder().decode(buf);
}
