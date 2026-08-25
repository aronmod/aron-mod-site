import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

import {
  finalizePaypalOrder,
  getCheckoutSummary,
  startPaypalOrder,
} from "@/lib/checkout.functions";
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
    payError: "Pagamento non completato. Nessun addebito confermato: riprova o contatta lo staff.",
    processing: "Verifica del pagamento in corso…",
    choose: "Scegli come pagare",
    backTicket: "Torna al ticket Discord",
    backCommunity: "Vai al server Discord",
    successTitle: "Pagamento completato",
    successNote: "La key verrà consegnata nel ticket Discord dopo la verifica del pagamento.",
    redirecting: "Ti reindirizziamo al tuo ticket Discord…",
    delivery: "La key verrà consegnata nel ticket Discord dopo la verifica del pagamento.",
    safe: "Non inserire mai la tua KeyAuth key su questo sito.",
    missingConfig: "Pagamenti temporaneamente non disponibili. Contatta lo staff su Discord.",
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
    payError: "Payment not completed. No confirmed charge: try again or contact staff.",
    processing: "Verifying your payment…",
    choose: "Choose how to pay",
    backTicket: "Back to Discord ticket",
    backCommunity: "Go to the Discord server",
    successTitle: "Payment completed",
    successNote: "The key will be delivered in your Discord ticket after the payment is verified.",
    redirecting: "Redirecting you to your Discord ticket…",
    delivery: "The key will be delivered in your Discord ticket after the payment is verified.",
    safe: "Never enter your KeyAuth key on this website.",
    missingConfig: "Payments temporarily unavailable. Please contact staff on Discord.",
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

function CheckoutPage() {
  const { token } = Route.useParams();
  const [uiLang] = useLang();

  const fetchSummary = useServerFn(getCheckoutSummary);
  const createOrder = useServerFn(startPaypalOrder);
  const finalize = useServerFn(finalizePaypalOrder);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<{ ticketUrl: string | null } | null>(null);
  const buttonsRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout", token],
    queryFn: () => fetchSummary({ data: { token } }),
    retry: false,
  });

  // The order locale is authoritative; the UI language is only a fallback.
  const lang = data?.locale ?? uiLang;
  const t = T[lang];

  const clientId = data?.state === "ok" ? (data.paypalClientId ?? "") : "";

  useEffect(() => {
    if (data?.state !== "ok" || !clientId || renderedRef.current) return;
    renderedRef.current = true;

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=EUR&intent=capture`;
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paypal = (window as unknown as { paypal?: any }).paypal;
      if (!paypal || !buttonsRef.current) return;
      paypal
        .Buttons({
          style: { layout: "vertical", shape: "pill", color: "blue", height: 48 },
          createOrder: async () => {
            setError(null);
            const res = await createOrder({ data: { token } });
            if (!res.ok || !res.paypalOrderId) throw new Error(res.error ?? "paypal_error");
            return res.paypalOrderId;
          },
          onApprove: async (details: { orderID: string }) => {
            setProcessing(true);
            // Only a server-verified capture unlocks the success state.
            const res = await finalize({ data: { token, paypalOrderId: details.orderID } });
            setProcessing(false);
            if (res.ok) {
              setSuccess({ ticketUrl: res.ticketUrl ?? null });
            } else {
              setError(t.payError);
            }
          },
          onError: () => setError(t.payError),
        })
        .render(buttonsRef.current);
    };
    script.onerror = () => setError(t.payError);
    document.body.appendChild(script);
  }, [data?.state, clientId, token, createOrder, finalize, t.payError]);

  // Auto-redirect only after the server confirmed the capture, and only to a
  // server-built ticket deep link.
  useEffect(() => {
    if (!success?.ticketUrl) return;
    const url = success.ticketUrl;
    const timer = window.setTimeout(() => {
      window.location.assign(url);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  if (isLoading) {
    return (
      <Shell>
        <div className="glass-card flex items-center gap-3 rounded-2xl p-7 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-accent" /> {t.loading}
        </div>
      </Shell>
    );
  }

  if (success) {
    return (
      <Shell>
        <div className="glass-card rounded-3xl p-7 sm:p-10">
          <Header title={t.title} />
          <div className="mt-8 flex flex-col items-center text-center">
            <CheckCircle2 aria-hidden className="h-14 w-14 text-emerald-400" />
            <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">{t.successTitle}</h1>
            <p className="mt-3 max-w-md text-sm text-foreground/90 sm:text-base">
              {t.successNote}
            </p>
            <a
              href={success.ticketUrl ?? LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-display mt-7 inline-flex w-full items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] px-6 py-3.5 text-base font-bold text-primary-foreground sm:w-auto"
            >
              {success.ticketUrl ? t.backTicket : t.backCommunity}
            </a>
            {success.ticketUrl ? (
              <p className="mt-3 text-xs text-muted-foreground">{t.redirecting}</p>
            ) : null}
          </div>
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

        <dl className="mt-8 space-y-3 text-sm sm:text-base">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t.plan}</dt>
            <dd className="font-display font-bold tracking-wide">{data?.plan?.toUpperCase()}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t.days}</dt>
            <dd className="font-bold">
              {data?.days} {t.daysUnit}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t.order}</dt>
            <dd className="font-mono text-xs sm:text-sm">{data?.orderRef}</dd>
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

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm"
          >
            {error}
          </p>
        ) : null}

        {processing ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-accent" /> {t.processing}
          </p>
        ) : null}

        {clientId ? (
          <div className="mt-8">
            <p className="font-display text-sm font-semibold tracking-wide text-foreground/90 sm:text-base">
              {t.choose}
            </p>
            <div ref={buttonsRef} className="mt-4" />
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">{t.missingConfig}</p>
        )}

        <p className="mt-8 text-sm text-foreground/90">{t.delivery}</p>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t.safe}
        </p>
      </div>
    </Shell>
  );
}
