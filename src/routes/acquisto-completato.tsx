import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";

import { EXTERNAL_LINK_PROPS, LINKS } from "@/config/links";
import { useLang } from "@/hooks/use-lang";

export const Route = createFileRoute("/acquisto-completato")({
  head: () => ({
    meta: [
      { title: "Acquisto completato — Aron Mod" },
      {
        name: "description",
        content:
          "Pagamento verificato: la tua licenza Aron Mod è stata attivata. Torna nel ticket Discord per i dettagli.",
      },
      { property: "og:title", content: "Acquisto completato — Aron Mod" },
      {
        property: "og:description",
        content: "Pagamento verificato: la tua licenza Aron Mod è stata attivata.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuccessPage,
});

const T = {
  it: {
    title: "Pagamento completato",
    text: "La tua licenza è stata attivata o estesa automaticamente. Torna nel tuo ticket su Discord: lì trovi piano, durata, nuova scadenza e — solo per le nuove licenze — la license key, mostrata una sola volta.",
    cta: "Torna su Discord",
    home: "Torna alla home",
  },
  en: {
    title: "Payment completed",
    text: "Your license has been activated or extended automatically. Go back to your Discord ticket for plan, duration, new expiry date and — for new licenses only — your license key, shown only once.",
    cta: "Back to Discord",
    home: "Back to home",
  },
} as const;

function SuccessPage() {
  const [lang] = useLang();
  const t = T[lang];
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70"
      />
      <div className="glass-card relative w-full max-w-lg rounded-2xl p-8 text-center">
        <CircleCheck aria-hidden className="mx-auto h-10 w-10 text-accent" />
        <h1 className="font-display mt-4 text-3xl font-bold">{t.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">{t.text}</p>
        <a
          href={LINKS.purchaseChannel}
          {...EXTERNAL_LINK_PROPS}
          className="font-display mt-7 inline-flex items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          {t.cta}
        </a>
        <div className="mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            {t.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
