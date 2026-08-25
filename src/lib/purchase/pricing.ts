// Client-safe pricing constants. The authoritative price is always resolved
// server-side from this whitelist map — never accepted from the client.

export type Plan = "base" | "plus";
export type Days = 15 | 30;

export const PRICE_TABLE: Record<Plan, Record<Days, number>> = {
  base: { 15: 900, 30: 1500 },
  plus: { 15: 1200, 30: 2000 },
};

export const CURRENCY = "EUR" as const;

export function isPlan(value: unknown): value is Plan {
  return value === "base" || value === "plus";
}

export function isDays(value: unknown): value is Days {
  return value === 15 || value === 30;
}

export function priceCents(plan: Plan, days: Days): number {
  return PRICE_TABLE[plan][days];
}

export function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}
