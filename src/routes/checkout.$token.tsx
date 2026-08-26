import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, TriangleAlert } from "lucide-react";

import { getCheckoutSummary } from "@/lib/checkout.functions";
import { formatEur } from "@/lib/purchase/pricing";
import { useLang } from "@/hooks/use-lang";
import { LINKS, EXTERNAL_LINK_PROPS } from "@/config/links";

export const Route = createFileRoute("/checkout/$token")({
  head: () => ({
    meta: [
      { title: "Checkout sicuro — Aron Mod" },
      {
        name: "description",
        content:
          "Completa in sicurezza l'acquisto di Aron Mod con PayPal. Prezzi e ordine verificati lato server.",
      },
      { property: "og:title", content: "Checkout sicuro — Aron Mod" },
      {
        property: "og:description",
        content: "Completa in sicurezza l'acquisto di Aron Mod con PayPal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutPage,
});

const T = {
  it: {
    title: "Checkout",
    brand: "Aron Mod",
    loading: "Caricamento dell'ordine…",
    notFound: "Link di pagamento non valido.",
    expired:
      "Questo link di pagamento è scaduto. Torna nel ticket Discord e richiedi un nuovo link.",
    paid: "Questo ordine risulta già pagato. Controlla il tuo ticket Discord.",
    cancelled: "Questo ordine è stato annullato.",
    plan: "Piano",
    days: "Durata",
    daysUnit: "giorni",
    total: "Totale",
    order: "Ordine",
    expires: "Il link scade il",
    backTicket: "Torna al ticket Discord",
    backCommunity: "Vai al server Discord",
    payNow: "🛒 PAGA ORA",
    importantTitle: "📌 IMPORTANTE",
    importantType: "Se PayPal chiede il tipo di pagamento, seleziona:",
    importantGoods: "✅ Pagamento di beni e servizi",
    importantTransaction: "Dopo il pagamento, copia l'ID transazione PayPal.",
    manualVerify:
      "Dopo il pagamento, torna nel ticket Discord e invia l'ID transazione PayPal insieme al codice ordine.",
    delivery:
      "La key verrà consegnata nel ticket Discord dopo la verifica manuale del pagamento da parte dello staff.",
  },
  en: {
    title: "Checkout",
    brand: "Aron Mod",
    loading: "Loading your order…",
    notFound: "Invalid payment link.",
    expired: "This payment link has expired. Go back to your Discord ticket and request a new one.",
    paid: "This order is already paid. Check your Discord ticket.",
    cancelled: "This order was cancelled.",
    plan: "Plan",
    days: "Duration",
    daysUnit: "days",
    total: "Total",
    order: "Order",
    expires: "Link expires on",
    backTicket: "Back to Discord ticket",
    backCommunity: "Go to the Discord server",
    payNow: "🛒 PAY NOW",
    importantTitle: "📌 IMPORTANT",
    importantType: "If PayPal asks for the payment type, select:",
    importantGoods: "✅ Goods and Services payment",
    importantTransaction: "After payment, copy the PayPal transaction ID.",
    manualVerify:
      "After payment, return to the Discord ticket and send the PayPal transaction ID along with the order code.",
    delivery:
      "The key will be delivered in the Discord ticket after the staff manually verifies the payment.",
  },
} as const;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70"
      />
      <div className="relative mx-auto w-full max-w-2xl">{children}</div>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/aron-logo.png"
        alt="Aron Mod"
        width={48}
        height={48}
        className="h-11 w-11 rounded-xl"
      />
      <div>
        <p className="font-display text-lg leading-none font-bold tracking-wide">ARON MOD</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

function paypalMeUrl(plan?: "base" | "plus", days?: 15 | 30): string | null {
  if (plan === "base" && days === 15) return "https://paypal.me/aronmod/9";
  if (plan === "base" && days === 30) return "https://paypal.me/aronmod/15";
  if (plan === "plus" && days === 15) return "https://paypal.me/aronmod/12";
  if (plan === "plus" && days === 30) return "https://paypal.me/aronmod/20";
  return null;
}

function CheckoutPage() {
  const { token } = Route.useParams();
  const [uiLang] = useLang();

  const fetchSummary = useServerFn(getCheckoutSummary);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout", token],
    queryFn: () => fetchSummary({ data: { token } }),
    retry: false,
  });

  // The order locale is authoritative; the UI language is only a fallback.
  const lang = data?.locale ?? uiLang;
  const t = T[lang];

  const paymentUrl = data?.state === "ok" ? paypalMeUrl(data.plan, data.days) : null;

  if (isLoading) {
    return (
      <Shell>
        <div className="glass-card flex items-center gap-3 rounded-2xl p-7 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-accent" /> {t.loading}
        </div>
      </Shell>
    );
  }

  const message =
    data?.state === "expired"
      ? t.expired
      : data?.state === "paid"
        ? t.paid
        : data?.state === "cancelled"
          ? t.cancelled
          : data?.state === "ok"
            ? null
            : t.notFound;

  if (message) {
    const fallbackUrl = data?.ticketUrl ?? LINKS.purchaseChannel;
    return (
      <Shell>
        <div className="glass-card rounded-3xl p-7 sm:p-10">
          <Header title={t.title} />
          <TriangleAlert aria-hidden className="mt-8 h-6 w-6 text-accent" />
          <p className="mt-3 text-sm text-foreground/90 sm:text-base">{message}</p>
          <a
            href={fallbackUrl}
            {...EXTERNAL_LINK_PROPS}
            className="font-display mt-6 inline-flex items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            {data?.ticketUrl ? t.backTicket : t.backCommunity}
          </a>
          <div className="mt-4">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              aronmod.net
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="glass-card rounded-3xl p-6 sm:p-10">
        <Header title={t.title} />

        <dl className="mt-8 space-y-3.5 text-base sm:text-lg">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t.plan}</dt>
            <dd className="font-display text-lg font-bold tracking-wide sm:text-xl">
              {data?.plan?.toUpperCase()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t.days}</dt>
            <dd className="font-display text-lg font-bold sm:text-xl">
              {data?.days} {t.daysUnit}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t.order}</dt>
            <dd className="font-mono text-base font-semibold tracking-wide sm:text-lg">
              {data?.orderRef}
            </dd>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 px-4 py-4">
            <dt className="font-display text-base font-semibold sm:text-lg">{t.total}</dt>
            <dd className="font-display text-2xl font-bold text-accent sm:text-3xl">
              {formatEur(data?.amountCents ?? 0)}
            </dd>
          </div>
        </dl>

        {data?.expiresAt ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t.expires} {new Date(data.expiresAt).toLocaleString(lang === "it" ? "it-IT" : "en-GB")}
          </p>
        ) : null}

        {paymentUrl ? (
          <div className="mt-8 space-y-5">
            <a
              href={paymentUrl}
              {...EXTERNAL_LINK_PROPS}
              className="font-display flex w-full items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] px-6 py-4 text-lg font-bold text-primary-foreground transition hover:opacity-90"
            >
              {t.payNow}
            </a>

            <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4 text-sm leading-relaxed text-foreground/90">
              <p className="font-display font-bold">{t.importantTitle}</p>
              <p className="mt-2">{t.importantType}</p>
              <p className="mt-1 font-semibold">{t.importantGoods}</p>
              <p className="mt-3">{t.importantTransaction}</p>
            </div>

            <p className="text-sm text-foreground/90 sm:text-base">{t.manualVerify}</p>
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            {lang === "it"
              ? "Pagamenti temporaneamente non disponibili. Contatta lo staff su Discord."
              : "Payments temporarily unavailable. Please contact staff on Discord."}
          </p>
        )}

        {data?.ticketUrl ? (
          <a
            href={data.ticketUrl}
            {...EXTERNAL_LINK_PROPS}
            className="font-display mt-6 inline-flex w-full items-center justify-center rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 sm:w-auto"
          >
            {t.backTicket}
          </a>
        ) : null}

        <p className="mt-8 text-sm text-foreground/90 sm:text-base">{t.delivery}</p>
      </div>
    </Shell>
  );
}
