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
          "Pagamento verificato automaticamente. Torna nel ticket Discord per ricevere la KeyAuth key dallo staff.",
      },
      { property: "og:title", content: "Acquisto completato — Aron Mod" },
      {
        property: "og:description",
        content:
          "Pagamento verificato automaticamente. Torna nel ticket Discord per ricevere la KeyAuth key dallo staff.",
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
    text: "Pagamento verificato automaticamente. Torna nel ticket Discord per ricevere la KeyAuth key dallo staff.",
    cta: "Torna su Discord",
    home: "Torna alla home",
  },
  en: {
    title: "Payment completed",
    text: "Payment verified automatically. Go back to your Discord ticket to receive your KeyAuth key from the staff.",
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
