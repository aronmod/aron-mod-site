// Server-only fraud pre-check derived from PayPal's own seller protection outcome.
//
// This is NOT a scoring system and never blocks a payment: it only decides whether
// the KeyAuth key can be assigned straight away, or whether staff must approve the
// delivery first. Cards and guest checkout are not penalised as such.

export type RiskOutcome = {
  /** Normalised seller_protection.status, or "MISSING" when PayPal sent nothing. */
  status: string;
  /** Minimal, non-sensitive audit note (dispute categories only). */
  reason: string | null;
  /** True when the outcome is anything other than full protection. */
  needsReview: boolean;
};

/**
 * Reads seller protection from a PayPal capture resource (server-side only —
 * never from client input) and normalises it.
 */
export function evaluateCaptureRisk(capture: unknown): RiskOutcome {
  const sp = (
    capture as { seller_protection?: { status?: unknown; dispute_categories?: unknown } } | null
  )?.seller_protection;

  const rawStatus = typeof sp?.status === "string" ? sp.status.trim().toUpperCase() : "";
  const status = rawStatus === "" ? "MISSING" : rawStatus;

  const categories = Array.isArray(sp?.dispute_categories)
    ? sp.dispute_categories
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim().toUpperCase().slice(0, 48))
        .slice(0, 4)
    : [];

  return {
    status: status.slice(0, 48),
    reason: categories.length > 0 ? categories.join(",") : null,
    needsReview: status !== "ELIGIBLE",
  };
}
