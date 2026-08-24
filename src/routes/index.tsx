import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  CircleCheck,
  Bot,
  Swords,
  Send,
  MessageCircle,
  ShoppingCart,
  Play,
  ChevronDown,
  Ticket,
  Mail,
  Server,
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Check,
  X,
  HelpCircle,
} from "lucide-react";

import shot1 from "@/assets/shot-1.jpg";
import shot2 from "@/assets/shot-2.jpg";
import { LINKS, EXTERNAL_LINK_PROPS } from "@/config/links";
import {
  SERVERS,
  SERVER_FEATURES,
  type ServerFeature,
  type ServerStatus,
  type Support,
} from "@/config/servers";
import { LinkModal } from "@/components/LinkModal";
import { copy, type Lang } from "@/lib/copy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: copy.it.meta.title },
      { name: "description", content: copy.it.meta.description },
      { property: "og:title", content: copy.it.meta.ogTitle },
      { property: "og:description", content: copy.it.meta.ogDescription },
    ],
  }),
  component: Index,
});

const featureIcons: LucideIcon[] = [Swords, Bot, ShieldCheck, Send];

const featureTones = [
  "var(--accent)",
  "var(--violet)",
  "var(--success)",
  "var(--magenta)",
] as const;

type ModalHandlers = {
  openTicket: () => void;
  openGuide: () => void;
  openDownload: () => void;
};

function Index() {
  const [lang, setLang] = useState<Lang>("it");
  const t = copy[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const handlers: ModalHandlers = {
    openTicket: () => setTicketOpen(true),
    openGuide: () => setGuideOpen(true),
    openDownload: () => setDownloadOpen(true),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header lang={lang} setLang={setLang} />
      <main>
        <Hero lang={lang} />
        <Features lang={lang} />
        <Servers lang={lang} />
        <Pricing lang={lang} />
        <Showcase lang={lang} />
        <DownloadSection openDownload={handlers.openDownload} lang={lang} />
        <Faq open={openFaq} setOpen={setOpenFaq} lang={lang} />
        <Support openTicket={handlers.openTicket} lang={lang} />
      </main>
      <Footer lang={lang} />

      <LinkModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title={t.modals.ticket.title}
        description={t.modals.ticket.desc}
        footer={
          <>
            {t.modals.ticket.join}{" "}
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-semibold text-accent underline underline-offset-4"
            >
              {t.modals.ticket.joinLink}
            </a>
          </>
        }
      >
        <a
          href={LINKS.ticketIt}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <Ticket className="h-4 w-4" /> {t.modals.ticket.it}
        </a>
        <a
          href={LINKS.ticketEn}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3 font-display font-bold transition-colors hover:border-primary"
        >
          <Ticket className="h-4 w-4 text-accent" /> {t.modals.ticket.en}
        </a>
      </LinkModal>

      <LinkModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={t.modals.guide.title}
        description={t.modals.guide.desc}
        footer={
          <>
            {t.modals.guide.join}{" "}
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-semibold text-accent underline underline-offset-4"
            >
              {t.modals.guide.joinLink}
            </a>
          </>
        }
      >
        <a
          href={LINKS.guideIt}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <BookOpen className="h-4 w-4" /> {t.modals.guide.it}
        </a>
        <a
          href={LINKS.guideEn}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3 font-display font-bold transition-colors hover:border-primary"
        >
          <BookOpen className="h-4 w-4 text-accent" /> {t.modals.guide.en}
        </a>
      </LinkModal>

      <LinkModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title={t.modals.download.title}
        description={t.modals.download.desc}
        footer={
          <>
            {t.modals.download.join}{" "}
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-semibold text-accent underline underline-offset-4"
            >
              {t.modals.download.joinLink}
            </a>
          </>
        }
      >
        <a
          href={LINKS.downloadIt}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <Download className="h-4 w-4" /> {t.modals.download.it}
        </a>
        <a
          href={LINKS.downloadEn}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3 font-display font-bold transition-colors hover:border-primary"
        >
          <Download className="h-4 w-4 text-accent" /> {t.modals.download.en}
        </a>
      </LinkModal>
    </div>
  );
}

function Header({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const t = copy[lang];
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <img
            src="/aron-logo.png"
            alt="Logo Aron Mod"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 drop-shadow-[0_0_12px_color-mix(in_oklab,var(--violet)_70%,transparent)]"
          />
          <span className="truncate font-display text-lg font-bold tracking-wide">
            ARON<span className="text-gradient"> MOD</span>
          </span>
        </a>
        <nav className="flex items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#funzioni" className="transition-colors hover:text-foreground">
              {t.header.functions}
            </a>
            <a href="#server" className="transition-colors hover:text-foreground">
              {t.header.servers}
            </a>
            <a href="#prezzi" className="transition-colors hover:text-foreground">
              {t.header.pricing}
            </a>
            <a href="#download" className="transition-colors hover:text-foreground">
              {t.header.loader}
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              {t.header.faq}
            </a>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setLang("it")}
              aria-pressed={lang === "it"}
              className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                lang === "it"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.header.langIt}
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                lang === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.header.langEn}
            </button>
          </div>

          <a
            href="#prezzi"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            {t.header.buy}
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <section id="top" className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[image:radial-gradient(120%_90%_at_50%_0%,color-mix(in_oklab,var(--primary)_12%,transparent)_0%,transparent_60%),radial-gradient(80%_60%_at_85%_20%,color-mix(in_oklab,var(--violet)_10%,transparent)_0%,transparent_65%)]" />
      <div className="surface-grid absolute inset-0 opacity-60" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <div className="reveal flex justify-center">
          <div className="relative">
            <div className="animate-pulse-glow absolute inset-0 rounded-full bg-violet/40 blur-3xl" />
            <img
              src="/aron-logo.png"
              alt="Logo Aron Mod"
              width={160}
              height={160}
              className="animate-float relative h-28 w-28 sm:h-40 sm:w-40"
            />
          </div>
        </div>

        <h1
          className="reveal mt-6 text-4xl leading-tight font-bold sm:text-6xl"
          style={{ animationDelay: "140ms" }}
        >
          {t.hero.title}
        </h1>

        <p
          className="reveal glass-card glow-ring mx-auto mt-7 max-w-3xl rounded-2xl px-5 py-5 font-display text-lg leading-relaxed font-semibold text-foreground sm:px-8 sm:py-6 sm:text-2xl"
          style={{ animationDelay: "200ms" }}
        >
          {t.hero.subtitle}
        </p>

        <div
          className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "260ms" }}
        >
          <a
            href="#prezzi"
            className="glow-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-7 py-3.5 font-display text-base font-bold text-primary-foreground transition-transform hover:scale-105 sm:w-auto"
          >
            <ShoppingCart className="h-5 w-5" /> {t.hero.ctaBuy}
          </a>
          <a
            href={LINKS.discordInvite}
            {...EXTERNAL_LINK_PROPS}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display text-base font-bold text-foreground transition-all hover:border-discord hover:bg-discord/15 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5 text-discord" /> {t.hero.ctaDiscord}
          </a>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
  textClassName,
}: {
  eyebrow?: string;
  title: string;
  text?: React.ReactNode;
  textClassName?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      {text ? (
        <div className={`mt-4 ${textClassName ?? "text-muted-foreground"}`}>{text}</div>
      ) : null}
    </div>
  );
}

function Features({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <section id="funzioni" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle title={t.features.title} text={t.features.text} />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.features.items.map((f, i) => {
          const Icon = featureIcons[i] ?? featureIcons[0]!;
          const tone = featureTones[i % featureTones.length]!;
          return (
            <article key={f.title} className="glass-card relative overflow-hidden rounded-2xl p-6">
              <span
                className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl"
                style={{ background: `color-mix(in oklab, ${tone} 35%, transparent)` }}
                aria-hidden="true"
              />
              <div
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in oklab, ${tone} 18%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tone} 45%, transparent), 0 12px 30px -14px color-mix(in oklab, ${tone} 70%, transparent)`,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: tone }} />
              </div>
              <h3 className="relative mt-4 text-lg font-bold">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.text}
              </p>
              <span
                className="absolute bottom-0 left-0 h-0.5 w-full opacity-70"
                style={{ background: `linear-gradient(90deg, ${tone}, transparent)` }}
                aria-hidden="true"
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SupportCell({
  value,
  lang,
  size = "md",
}: {
  value: Support;
  lang: Lang;
  size?: "xs" | "sm" | "md";
}) {
  const t = copy[lang].servers;
  const pad = size === "xs" ? "p-0.5" : size === "sm" ? "p-1" : "p-1.5";
  const icon = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3 w-3" : "h-4 w-4";
  if (value === true) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--success)_18%,transparent)] ${pad} ring-1 ring-[color-mix(in_oklab,var(--success)_45%,transparent)]`}
        title={t.legendYes}
      >
        <Check className={`${icon} text-[var(--success)]`} aria-hidden="true" />
        <span className="sr-only">{t.legendYes}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--danger)_16%,transparent)] ${pad} ring-1 ring-[color-mix(in_oklab,var(--danger)_40%,transparent)]`}
        title={t.legendNo}
      >
        <X className={`${icon} text-[var(--danger)]`} aria-hidden="true" />
        <span className="sr-only">{t.legendNo}</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--warning)_16%,transparent)] ${pad} ring-1 ring-[color-mix(in_oklab,var(--warning)_40%,transparent)]`}
      title={t.unknown}
    >
      <HelpCircle className={`${icon} text-[var(--warning)]`} aria-hidden="true" />
      <span className="sr-only">{t.unknown}</span>
    </span>
  );
}

function StatusBadge({ status, lang }: { status: ServerStatus; lang: Lang }) {
  const t = copy[lang].servers.status;
  const map: Record<ServerStatus, { label: string; color: string }> = {
    working: { label: t.working, color: "var(--success)" },
    partial: { label: t.partial, color: "var(--warning)" },
    down: { label: t.down, color: "var(--danger)" },
    unknown: { label: t.unknown, color: "var(--muted-foreground)" },
  };
  const { label, color } = map[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 38%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse-glow"
        style={{ background: color }}
        aria-hidden="true"
      />
      <span className="font-clean">{label}</span>
    </span>
  );
}

function Servers({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ServerFeature[]>([]);

  const toggleFilter = (f: ServerFeature) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const filtered = SERVERS.filter(
    (row) =>
      row.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      activeFilters.every((f) => row.features[f] !== false),
  );

  const hasFilters = query.trim().length > 0 || activeFilters.length > 0;
  const reset = () => {
    setQuery("");
    setActiveFilters([]);
  };

  const featureLabels: Record<ServerFeature, string> = {
    autoDungeon: t.servers.filters.autoDungeon,
    switchAmmalia: t.servers.filters.switchAmmalia,
    autoAlchimia: t.servers.filters.autoAlchimia,
    captcha: t.servers.filters.captcha,
  };

  return (
    <section id="server" className="relative border-y border-border/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70% 60% at 15% 0%, color-mix(in oklab, var(--violet) 14%, transparent) 0%, transparent 60%), radial-gradient(70% 60% at 90% 100%, color-mix(in oklab, var(--accent) 12%, transparent) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionTitle title={t.servers.title} text={t.servers.text} />

        <div className="spectrum-frame mx-auto mt-10 w-full lg:max-w-4xl">
          <div className="spectrum-inner p-4 sm:p-5">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-accent"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.servers.searchPlaceholder}
                  aria-label={t.servers.searchPlaceholder}
                  className="font-clean w-full rounded-xl border border-border bg-background/60 py-3 pr-4 pl-11 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Filter chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-clean mr-1 text-xs tracking-wide text-muted-foreground uppercase">
                {t.servers.filtersLabel}
              </span>
              {SERVER_FEATURES.map((f) => {
                const active = activeFilters.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFilter(f)}
                    aria-pressed={active}
                    className={`font-clean rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      active
                        ? "bg-[image:var(--gradient-spectrum)] text-primary-foreground shadow-[var(--shadow-glow)]"
                        : "border border-border bg-background/50 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    }`}
                  >
                    {featureLabels[f]}
                  </button>
                );
              })}
              {hasFilters ? (
                <button
                  type="button"
                  onClick={reset}
                  className="font-clean rounded-full px-3 py-1.5 text-xs font-semibold text-accent underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {t.servers.reset}
                </button>
              ) : null}
            </div>

            {/* Desktop table */}
            <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-border/60 md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-4 py-2.5 font-display text-xs font-bold tracking-wider uppercase">
                      {t.servers.colServer}
                    </th>
                    <th className="px-4 py-2.5 font-display text-xs font-bold tracking-wider uppercase">
                      {t.servers.colStatus}
                    </th>
                    <th className="px-4 py-2.5 text-center font-display text-xs font-bold tracking-wider uppercase">
                      {t.servers.colBase}
                    </th>
                    <th className="px-4 py-2.5 text-center font-display text-xs font-bold tracking-wider uppercase">
                      {t.servers.colPlus}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.name}
                      className="border-t border-border/40 transition-colors hover:bg-primary/10"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={row.url}
                          {...EXTERNAL_LINK_PROPS}
                          className="inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <Server className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                          <span className="font-clean">{row.name}</span>
                          <ExternalLink
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} lang={lang} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SupportCell value={row.base} lang={lang} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SupportCell value={row.plus} lang={lang} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-5 grid gap-4 md:hidden">
              {filtered.map((row) => (
                <article key={row.name} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={row.url}
                      {...EXTERNAL_LINK_PROPS}
                      className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-accent"
                    >
                      <Server className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span className="font-clean">{row.name}</span>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </a>
                    <StatusBadge status={row.status} lang={lang} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    {(
                      [
                        [t.servers.colBase, row.base],
                        [t.servers.colPlus, row.plus],
                      ] as [string, Support][]
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
                      >
                        <dt className="font-clean text-muted-foreground">{label}</dt>
                        <dd>
                          <SupportCell value={value} lang={lang} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center">
                <p className="font-display font-bold text-foreground">{t.servers.noResults}</p>
                <p className="font-clean mt-1 text-sm text-muted-foreground">
                  {t.servers.noResultsHint}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="font-clean mt-4 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary"
                >
                  {t.servers.reset}
                </button>
              </div>
            ) : null}

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4 text-xs">
              <span className="font-clean flex items-center gap-2 text-muted-foreground">
                <SupportCell value={true} lang={lang} size="xs" /> {t.servers.legendYes}
              </span>
              <span className="font-clean flex items-center gap-2 text-muted-foreground">
                <SupportCell value={false} lang={lang} size="xs" /> {t.servers.legendNo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing({ lang }: { lang: Lang }) {
  const t = copy[lang].pricing;
  const guideUrl = lang === "it" ? LINKS.guideIt : LINKS.guideEn;

  const PlanCard = ({
    plan,
    highlight,
  }: {
    plan: (typeof t)["base"] | (typeof t)["plus"];
    highlight: boolean;
  }) => (
    <article
      className={`glass-card relative flex flex-col rounded-2xl p-7 ${highlight ? "glow-ring border-primary/60" : ""}`}
    >
      {plan.bestValue ? (
        <span className="absolute top-5 right-5 rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold tracking-wider text-accent uppercase">
          {plan.bestValueLabel}
        </span>
      ) : null}
      <h3 className="font-display text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      <div className="mt-5 flex flex-col gap-3">
        <a
          href={guideUrl}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3.5 font-display font-bold text-foreground transition-all hover:scale-105 hover:border-primary"
        >
          <ExternalLink className="h-4 w-4" /> {plan.cta15}
        </a>
        <a
          href={guideUrl}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <ExternalLink className="h-4 w-4" /> {plan.cta30}
        </a>
      </div>

      {"includes" in plan ? (
        <div className="mt-6 rounded-xl bg-primary/10 p-4">
          <p className="text-sm font-semibold leading-relaxed text-foreground sm:text-base">
            {plan.includesIntro}
          </p>
          <ul className="mt-3 space-y-1.5">
            {plan.includes.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Check
                  className="h-4 w-4 shrink-0"
                  style={{
                    color: "color-mix(in oklab, var(--accent) 60%, var(--violet))",
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
        {t.commonPerks.map((perk) => (
          <li key={perk} className="flex items-start gap-2">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {perk}
          </li>
        ))}
      </ul>
    </article>
  );

  return (
    <section id="prezzi" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle
        title={t.title}
        text={
          <p className="mx-auto max-w-xl text-base leading-relaxed font-normal text-foreground/90 sm:text-lg">
            {t.subtitle}
          </p>
        }
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <PlanCard plan={t.base} highlight={false} />
        <PlanCard plan={t.plus} highlight={true} />
      </div>
    </section>
  );
}

function Showcase({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const shots = [
    { src: shot1, alt: t.showcase.shots[0].alt },
    { src: shot2, alt: t.showcase.shots[1].alt },
  ];

  return (
    <section id="media" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle title={t.showcase.title} text={t.showcase.text} />

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <a
          href={LINKS.discordInvite}
          {...EXTERNAL_LINK_PROPS}
          className="glass-card group relative col-span-1 overflow-hidden rounded-2xl lg:col-span-2"
        >
          <img
            src={shot2}
            alt={t.showcase.videoSub}
            loading="lazy"
            width={1280}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <span className="glow-ring inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/25 backdrop-blur">
              <Play className="h-6 w-6 fill-current text-accent" />
            </span>
            <span className="font-display text-lg font-bold">{t.showcase.videoLabel}</span>
            <span className="text-xs text-muted-foreground">{t.showcase.videoSub}</span>
          </div>
        </a>

        <div className="grid gap-4">
          {shots.map((s) => (
            <figure key={s.alt} className="glass-card overflow-hidden rounded-2xl">
              <img
                src={s.src}
                alt={s.alt}
                loading="lazy"
                width={1280}
                height={800}
                className="h-40 w-full object-cover sm:h-48"
              />
              <figcaption className="px-4 py-3 text-xs text-muted-foreground">{s.alt}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadSection({ openDownload, lang }: { openDownload: () => void; lang: Lang }) {
  const t = copy[lang].loader;
  const guideUrl = lang === "it" ? LINKS.guideIt : LINKS.guideEn;
  return (
    <section id="download" className="relative overflow-hidden border-y border-border/60">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t.title}</h2>
          <p className="mt-4 text-muted-foreground">{t.description}</p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {t.specs.map((i) => (
              <li key={i} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {i}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openDownload}
              className="glow-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-7 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              <Download className="h-5 w-5" /> {t.download}
            </button>
            <a
              href={guideUrl}
              {...EXTERNAL_LINK_PROPS}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display font-bold transition-colors hover:border-primary"
            >
              <ShoppingCart className="h-5 w-5 text-accent" /> {t.buyLicense}
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="animate-pulse-glow absolute inset-8 rounded-full bg-violet/25 blur-3xl" />
          <div className="relative grid grid-cols-2 items-center gap-4 sm:gap-6">
            <figure className="glass-card animate-float overflow-hidden rounded-2xl p-2 sm:translate-y-4">
              <img
                src="/loader-login.png"
                alt={t.images.loginAlt}
                loading="lazy"
                width={400}
                height={580}
                className="w-full rounded-xl"
              />
              <figcaption className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                {t.images.loginCaption}
              </figcaption>
            </figure>
            <figure className="glass-card glow-ring overflow-hidden rounded-2xl p-2 sm:-translate-y-4">
              <img
                src="/loader-launch.png"
                alt={t.images.launchAlt}
                loading="lazy"
                width={400}
                height={580}
                className="w-full rounded-xl"
              />
              <figcaption className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                {t.images.launchCaption}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq({
  open,
  setOpen,
  lang,
}: {
  open: number | null;
  setOpen: (i: number | null) => void;
  lang: Lang;
}) {
  const t = copy[lang];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle title={t.support.title} />
      <div className="mt-10 space-y-3">
        {t.faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="glass-card overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <span className="min-w-0 flex-1 font-display text-base font-bold">{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-accent transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Support({ openTicket, lang }: { openTicket: () => void; lang: Lang }) {
  const t = copy[lang];
  return (
    <section id="assistenza" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
      <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-60" />
        <div className="relative">
          <span className="glow-ring inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-discord/20">
            <Ticket className="h-6 w-6 text-discord" />
          </span>
          <h2 className="mt-5 text-3xl font-bold">{t.support.ticketTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t.support.ticketText}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openTicket}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-discord px-7 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105 sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" /> {t.support.ctaTicket}
            </button>
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 font-display font-bold transition-colors hover:border-primary sm:w-auto"
            >
              <Mail className="h-5 w-5 text-accent" /> {t.support.ctaDiscord}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/aron-logo.png"
                alt="Logo Aron Mod"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <span className="font-display text-lg font-bold">
                ARON<span className="text-gradient"> MOD</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t.footer.disclaimer}</p>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold tracking-wider uppercase">
              {t.footer.navTitle}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {t.footer.nav.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="transition-colors hover:text-foreground">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold tracking-wider uppercase">
              {t.footer.legalTitle}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {t.footer.legal.map(([label, href]) => {
                const isExternal = href.startsWith("http");
                return (
                  <li key={label}>
                    <a
                      href={href}
                      {...(isExternal ? EXTERNAL_LINK_PROPS : {})}
                      className="transition-colors hover:text-foreground"
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.copyright.replace("{year}", String(new Date().getFullYear()))}</p>
          <p>{t.footer.risk}</p>
        </div>
      </div>
    </footer>
  );
}
