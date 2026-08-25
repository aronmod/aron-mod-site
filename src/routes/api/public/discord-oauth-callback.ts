// Public OAuth2 callback: verifies the signed state, exchanges the code
// server-side, guarantees guild membership, then creates the ticket + order and
// sends the browser straight to the checkout page.

import { createFileRoute } from "@tanstack/react-router";

const DISCORD_INVITE = "https://discord.gg/CyUESCgyq3";

function redirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { location: url, "cache-control": "no-store" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );
}

/** Minimal Aron Mod styled IT/EN page. Used for join failures and hard errors. */
function page(options: {
  locale: "it" | "en";
  title: string;
  message: string;
  retryUrl: string | null;
  status: number;
}) {
  const c =
    options.locale === "it"
      ? { join: "Entra nel server Discord", retry: "Riprova", back: "Torna al sito" }
      : { join: "Join the Discord server", retry: "Retry", back: "Back to the site" };
  const html = `<!doctype html>
<html lang="${options.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(options.title)} · Aron Mod</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background: radial-gradient(70% 60% at 15% 0%, #16224a 0%, #05070f 60%), #05070f;
    color:#e8ecf8; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; padding:24px; }
  main { width:100%; max-width:520px; background:rgba(16,22,40,.75); border:1px solid rgba(120,150,255,.25);
    border-radius:20px; padding:32px 28px; box-shadow:0 30px 80px -40px rgba(60,110,255,.7); }
  h1 { font-size:1.4rem; margin:0 0 12px; letter-spacing:.2px; }
  p { margin:0 0 22px; line-height:1.6; color:#b7c0da; }
  a { display:flex; align-items:center; justify-content:center; text-decoration:none; font-weight:700;
    padding:13px 18px; border-radius:12px; margin-top:10px; }
  .primary { background:linear-gradient(120deg,#3f6bff,#22d3ee); color:#05070f; }
  .ghost { border:1px solid rgba(140,165,255,.35); color:#e8ecf8; }
  a:focus-visible { outline:2px solid #22d3ee; outline-offset:2px; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(options.title)}</h1>
  <p>${escapeHtml(options.message)}</p>
  <a class="primary" href="${DISCORD_INVITE}" target="_blank" rel="noopener noreferrer">${c.join}</a>
  ${options.retryUrl ? `<a class="ghost" href="${escapeHtml(options.retryUrl)}">${c.retry}</a>` : `<a class="ghost" href="/">${c.back}</a>`}
</main>
</body>
</html>`;
  return new Response(html, {
    status: options.status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

const COPY = {
  it: {
    joinTitle: "Devi entrare nel server Aron Mod",
    joinText:
      "Non è stato possibile aggiungerti automaticamente al server Discord. Entra nel server e poi premi Riprova: la tua scelta di piano e durata è conservata.",
    errorTitle: "Qualcosa è andato storto",
    errorText:
      "Non è stato possibile completare l'accesso con Discord. Riprova tra poco: la tua scelta di piano e durata è conservata.",
    expiredTitle: "Sessione scaduta",
    expiredText: "Il link di accesso è scaduto o non è valido. Torna al sito e riprova l'acquisto.",
  },
  en: {
    joinTitle: "You need to join the Aron Mod server",
    joinText:
      "We could not add you to the Discord server automatically. Join the server, then press Retry: your plan and duration are saved.",
    errorTitle: "Something went wrong",
    errorText:
      "We could not complete the Discord sign-in. Please try again shortly: your plan and duration are saved.",
    expiredTitle: "Session expired",
    expiredText: "This sign-in link expired or is invalid. Go back to the site and start again.",
  },
} as const;

export const Route = createFileRoute("/api/public/discord-oauth-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const oauth = await import("@/lib/purchase/discord-oauth.server");
        const url = new URL(request.url);
        const code = url.searchParams.get("code");

        let selection: Awaited<ReturnType<typeof oauth.verifyState>> = null;
        try {
          selection = await oauth.verifyState(url.searchParams.get("state"));
        } catch {
          selection = null;
        }
        if (!selection) {
          return page({
            locale: "it",
            title: COPY.it.expiredTitle,
            message: `${COPY.it.expiredText} — ${COPY.en.expiredText}`,
            retryUrl: null,
            status: 400,
          });
        }

        const { plan, days, locale } = selection;
        const c = COPY[locale];
        const retryUrl = `/api/public/discord-oauth-start?plan=${plan}&days=${days}&locale=${locale}`;

        if (!code) {
          return page({
            locale,
            title: c.errorTitle,
            message: c.errorText,
            retryUrl,
            status: 400,
          });
        }

        let accessToken: string | null = null;
        try {
          const fp = await oauth.clientFingerprint(request);
          if (!(await oauth.allowRequest(`oauth_cb:${fp}`, 10, 300))) {
            return page({ locale, title: c.errorTitle, message: c.errorText, retryUrl, status: 429 });
          }
          if (!(await oauth.allowRequest(`oauth_state:${selection.nonce}`, 1, 900))) {
            return page({ locale, title: c.errorTitle, message: c.errorText, retryUrl, status: 429 });
          }

          const redirectUri = oauth.oauthRedirectUri(request.url);
          const token = await oauth.exchangeCode(code, redirectUri);
          if (!token) {
            return page({ locale, title: c.errorTitle, message: c.errorText, retryUrl, status: 502 });
          }
          accessToken = token.accessToken;

          const userId = await oauth.fetchOauthUserId(accessToken);
          if (!userId) {
            return page({ locale, title: c.errorTitle, message: c.errorText, retryUrl, status: 502 });
          }
          if (!(await oauth.allowRequest(`oauth_user:${userId}`, 8, 600))) {
            return page({ locale, title: c.errorTitle, message: c.errorText, retryUrl, status: 429 });
          }

          const joined = await oauth.ensureGuildMember(userId, accessToken);
          if (!joined) {
            return page({ locale, title: c.joinTitle, message: c.joinText, retryUrl, status: 200 });
          }

          const { createSiteOrderAndTicket } = await import("@/lib/purchase/site-purchase.server");
          const result = await createSiteOrderAndTicket({
            discordUserId: userId,
            plan,
            days,
            locale,
            requestUrl: request.url,
          });
          if (!result) {
            return page({ locale, title: c.joinTitle, message: c.joinText, retryUrl, status: 200 });
          }
          return redirect(result.checkoutUrl);
        } catch (error) {
          console.error("oauth_callback_failed", {
            reason: error instanceof Error ? error.message : "unknown",
          });
          return page({ locale, title: c.errorTitle, message: c.errorText, retryUrl, status: 500 });
        } finally {
          if (accessToken) await oauth.revokeToken(accessToken);
        }
      },
    },
  },
});
