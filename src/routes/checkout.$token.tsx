import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

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
          "Completa in sicurezza l'acquisto della tua licenza Aron Mod con PayPal. Prezzi e ordine verificati lato server.",
      },
      { property: "og:title", content: "Checkout sicuro — Aron Mod" },
      {
        property: "og:description",
        content: "Completa in sicurezza l'acquisto della tua licenza Aron Mod con PayPal.",
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
    title: "Checkout Aron Mod",
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
    backTicket: "Torna al Discord",
    safe: "Prezzo e ordine sono verificati lato server. Non inserire mai la tua license key su questo sito.",
    missingConfig: "Pagamenti temporaneamente non disponibili. Contatta lo staff su Discord.",
  },
  en: {
    title: "Aron Mod checkout",
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
    backTicket: "Back to Discord",
    safe: "Price and order are verified server-side. Never enter your license key on this website.",
    missingConfig: "Payments temporarily unavailable. Please contact staff on Discord.",
  },
} as const;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70"
      />
      <div className="relative mx-auto w-full max-w-lg">{children}</div>
    </main>
  );
}

function CheckoutPage() {
  const { token } = Route.useParams();
  const [lang] = useLang();
  const t = T[lang];
  const navigate = useNavigate();

  const fetchSummary = useServerFn(getCheckoutSummary);
  const createOrder = useServerFn(startPaypalOrder);
  const finalize = useServerFn(finalizePaypalOrder);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const buttonsRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout", token],
    queryFn: () => fetchSummary({ data: { token } }),
    retry: false,
  });

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
          style: { layout: "vertical", shape: "pill", color: "blue" },
          createOrder: async () => {
            setError(null);
            const res = await createOrder({ data: { token } });
            if (!res.ok || !res.paypalOrderId) throw new Error(res.error ?? "paypal_error");
            return res.paypalOrderId;
          },
          onApprove: async (details: { orderID: string }) => {
            setProcessing(true);
            const res = await finalize({ data: { token, paypalOrderId: details.orderID } });
            setProcessing(false);
            if (res.ok) {
              void navigate({ to: "/acquisto-completato" });
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
  }, [data?.state, clientId, token, createOrder, finalize, navigate, t.payError]);

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
    return (
      <Shell>
        <div className="glass-card rounded-2xl p-7">
          <TriangleAlert aria-hidden className="h-6 w-6 text-accent" />
          <h1 className="font-display mt-3 text-2xl font-bold">{t.title}</h1>
          <p className="mt-3 text-sm text-foreground/90">{message}</p>
          <a
            href={LINKS.purchaseChannel}
            {...EXTERNAL_LINK_PROPS}
            className="font-display mt-6 inline-flex items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            {t.backTicket}
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
      <div className="glass-card rounded-2xl p-7">
        <h1 className="font-display text-2xl font-bold">{t.title}</h1>
        <dl className="mt-6 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t.plan}</dt>
            <dd className="font-bold">{data?.plan?.toUpperCase()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t.days}</dt>
            <dd className="font-bold">
              {data?.days} {t.daysUnit}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t.order}</dt>
            <dd className="font-mono text-xs">{data?.orderRef}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-3 text-base">
            <dt className="font-semibold">{t.total}</dt>
            <dd className="font-display font-bold text-accent">
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
          <div ref={buttonsRef} className="mt-6" />
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">{t.missingConfig}</p>
        )}

        <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t.safe}
        </p>
      </div>
    </Shell>
  );
}
