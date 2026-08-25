// Public entry point of the website purchase flow: validates the selection,
// signs a short-lived anti-CSRF state and redirects to Discord OAuth2.

import { createFileRoute } from "@tanstack/react-router";

function redirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { location: url, "cache-control": "no-store" },
  });
}

function text(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/discord-oauth-start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const oauth = await import("@/lib/purchase/discord-oauth.server");
        const { isDays, isPlan } = await import("@/lib/purchase/pricing");
        const { normalizeLocale } = await import("@/lib/purchase/discord-copy.server");

        const url = new URL(request.url);
        const plan = url.searchParams.get("plan");
        const days = Number(url.searchParams.get("days"));
        const locale = normalizeLocale(url.searchParams.get("locale"));
        if (!isPlan(plan) || !isDays(days)) return text("invalid selection", 400);

        // Default path uses prompt=none so returning buyers skip the consent
        // screen; the callback re-enters here with prompt=consent only when
        // Discord signals that consent/interaction is required.
        const promptParam = url.searchParams.get("prompt");
        const prompt = oauth.isOauthPrompt(promptParam) ? promptParam : "none";

        try {
          const fp = await oauth.clientFingerprint(request);
          const allowed = await oauth.allowRequest(`oauth_start:${fp}`, 10, 300);
          if (!allowed) return text("too many requests", 429);

          const redirectUri = oauth.oauthRedirectUri(request.url);
          const state = await oauth.signState({ plan, days, locale }, prompt);
          return redirect(oauth.authorizeUrl(state, redirectUri, prompt));
        } catch (error) {
          console.error("oauth_start_failed", {
            reason: error instanceof Error ? error.message : "unknown",
          });
          return text("oauth not configured", 503);
        }
      },
    },
  },
});
