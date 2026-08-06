import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
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
} from "lucide-react";

import logo from "@/assets/aron-logo.png.asset.json";
import heroBg from "@/assets/hero-bg.jpg";
import shot1 from "@/assets/shot-1.jpg";
import shot2 from "@/assets/shot-2.jpg";
import loaderLogin from "@/assets/loader-login.png.asset.json";
import loaderLaunch from "@/assets/loader-launch.png.asset.json";
import { LINKS, EXTERNAL_LINK_PROPS } from "@/config/links";
import { LinkModal } from "@/components/LinkModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aron Mod — La mod premium per Metin2 su retro server" },
      {
        name: "description",
        content:
          "Aron Mod: mod premium per retro server Metin2 autorizzati. Funzioni, server supportati, licenze da 8 €, guide e assistenza tramite ticket sul Discord ufficiale.",
      },
      { property: "og:title", content: "Aron Mod — Domina Metin con Aron Mod" },
      {
        property: "og:description",
        content:
          "Auto farm, ESP e bot avanzato per retro server Metin2 autorizzati. Licenze da 8 €, guide e ticket sul Discord ufficiale.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Swords,
    title: "Auto Dungeon",
    text: "Completa i dungeon in automatico con sequenze ottimizzate, gestione delle fasi e ripetizione dei run senza presidiare il PC.",
  },
  {
    icon: Bot,
    title: "Auto Farm",
    text: "Farming automatico di metin, mob e boss con rotte personalizzabili e ritorno al villaggio quando l'inventario è pieno.",
  },
  {
    icon: ShieldCheck,
    title: "Anti Ban",
    text: "Comportamenti configurabili con pause e tempistiche naturali, pensati per un utilizzo prudente e responsabile sul server.",
  },
  {
    icon: Send,
    title: "Controllo Remoto",
    text: "Gestisci e monitora la mod ovunque tu sia: avvio, stop e stato delle sessioni direttamente da Telegram.",
  },
];

const faq = [
  {
    q: "Aron Mod è sicuro da usare?",
    a: "Aron Mod è pensata esclusivamente per retro server e server privati autorizzati. Consigliamo sempre un uso moderato e responsabile, nel rispetto delle regole del server su cui giochi.",
  },
  {
    q: "Come funziona l'acquisto?",
    a: "Per acquistare Aron Mod, entra nel nostro Discord ufficiale e apri un ticket nella sezione italiana o inglese. Lo staff ti fornirà tutte le informazioni necessarie e ti guiderà durante l'acquisto.",
  },
  {
    q: "Su quali server funziona?",
    a: "Aron Mod è attualmente disponibile per I-Longju. Consulta la sezione Server supportati per accedere al sito del server. Ulteriori compatibilità verranno comunicate sul nostro Discord ufficiale.",
  },
  {
    q: "Posso usarla su più PC?",
    a: "La licenza è legata a un singolo HWID. Puoi richiedere un reset gratuito al mese aprendo un ticket sul Discord ufficiale.",
  },
  {
    q: "Quali sono i requisiti?",
    a: "Windows 10 o 11 a 64 bit, client del retro server aggiornato e antivirus configurato con un'eccezione per il loader.",
  },
  {
    q: "Come ricevo gli aggiornamenti?",
    a: "Il loader si aggiorna in automatico a ogni avvio. Le patch note vengono pubblicate nel canale #changelog del Discord.",
  },
];

type ModalHandlers = {
  openTicket: () => void;
  openGuide: () => void;
  openDownload: () => void;
};

function Index() {
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
      <Header {...handlers} />
      <main>
        <Hero />
        <Features />
        <Servers />
        <Pricing {...handlers} />
        <Showcase />
        <DownloadSection {...handlers} />
        <Faq open={openFaq} setOpen={setOpenFaq} />
        <Support {...handlers} />
      </main>
      <Footer />

      <LinkModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title="Apri un ticket"
        description="Scegli la lingua con cui vuoi ricevere assistenza per l'acquisto."
        footer={
          <>
            Non sei ancora nel nostro Discord?{" "}
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-semibold text-accent underline underline-offset-4"
            >
              Entra prima nel server.
            </a>
          </>
        }
      >
        <a
          href={LINKS.ticketIt}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <Ticket className="h-4 w-4" /> Italiano
        </a>
        <a
          href={LINKS.ticketEn}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3 font-display font-bold transition-colors hover:border-primary"
        >
          <Ticket className="h-4 w-4 text-accent" /> English
        </a>
      </LinkModal>

      <LinkModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Come ottenere la mod"
        description="Consulta la guida nella tua lingua e segui le istruzioni pubblicate nel nostro Discord."
        footer={
          <>
            Non fai ancora parte della community?{" "}
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-semibold text-accent underline underline-offset-4"
            >
              Entra nel Discord ufficiale.
            </a>
          </>
        }
      >
        <a
          href={LINKS.guideIt}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <BookOpen className="h-4 w-4" /> Guida italiana
        </a>
        <a
          href={LINKS.guideEn}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3 font-display font-bold transition-colors hover:border-primary"
        >
          <BookOpen className="h-4 w-4 text-accent" /> English guide
        </a>
      </LinkModal>

      <LinkModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title="Download"
        description="Scegli la lingua per accedere al canale di download sul nostro Discord ufficiale."
        footer={
          <>
            Discord ufficiale:{" "}
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="font-semibold text-accent underline underline-offset-4"
            >
              discord.gg/yQMrcWxY
            </a>
          </>
        }
      >
        <a
          href={LINKS.downloadIt}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-5 py-3 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          <Download className="h-4 w-4" /> Italiano
        </a>
        <a
          href={LINKS.downloadEn}
          {...EXTERNAL_LINK_PROPS}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-5 py-3 font-display font-bold transition-colors hover:border-primary"
        >
          <Download className="h-4 w-4 text-accent" /> English
        </a>
      </LinkModal>
    </div>
  );
}

function Header({ openTicket }: ModalHandlers) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <img
            src={logo.url}
            alt="Logo Aron Mod"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 drop-shadow-[0_0_12px_color-mix(in_oklab,var(--violet)_70%,transparent)]"
          />
          <span className="truncate font-display text-lg font-bold tracking-wide">
            ARON<span className="text-gradient"> MOD</span>
          </span>
        </a>
        <nav className="flex items-center gap-6">
          <div className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#funzioni" className="transition-colors hover:text-foreground">
              Funzioni
            </a>
            <a href="#server" className="transition-colors hover:text-foreground">
              Server
            </a>
            <a href="#prezzi" className="transition-colors hover:text-foreground">
              Prezzi
            </a>
            <a href="#download" className="transition-colors hover:text-foreground">
              Loader
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </div>
          <button
            type="button"
            onClick={openTicket}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Acquista
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <img
        src={heroBg}
        alt="Battaglia nel mondo di Metin2"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
      <div className="surface-grid absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <div className="reveal flex justify-center">
          <div className="relative">
            <div className="animate-pulse-glow absolute inset-0 rounded-full bg-violet/40 blur-3xl" />
            <img
              src={logo.url}
              alt="Logo Aron Mod"
              width={160}
              height={160}
              className="animate-float relative h-28 w-28 sm:h-40 sm:w-40"
            />
          </div>
        </div>

        <p
          className="reveal mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-accent uppercase"
          style={{ animationDelay: "80ms" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Solo retro server autorizzati
        </p>

        <h1
          className="reveal mt-6 text-4xl leading-tight font-bold sm:text-6xl"
          style={{ animationDelay: "140ms" }}
        >
          Domina Metin con <span className="text-gradient">Aron Mod</span>
        </h1>

        <p
          className="reveal glass-card glow-ring mx-auto mt-7 max-w-3xl rounded-2xl px-5 py-5 font-display text-lg leading-relaxed font-semibold text-foreground sm:px-8 sm:py-6 sm:text-2xl"
          style={{ animationDelay: "200ms" }}
        >
          La mod premium per i retro server di Metin2:{" "}
          <span className="text-gradient">AutoDungeon</span>,{" "}
          <span className="text-gradient">FarmBot</span>, gestione da remoto con{" "}
          <span className="text-gradient">Telegram</span> e bot avanzato in un'unica interfaccia
          leggera e sempre aggiornata.
        </p>

        <div
          className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "260ms" }}
        >
          <a
            href="#prezzi"
            className="glow-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-7 py-3.5 font-display text-base font-bold text-primary-foreground transition-transform hover:scale-105 sm:w-auto"
          >
            <ShoppingCart className="h-5 w-5" /> Acquista la mod
          </a>
          <a
            href={LINKS.discordInvite}
            {...EXTERNAL_LINK_PROPS}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display text-base font-bold text-foreground transition-all hover:border-discord hover:bg-discord/15 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5 text-discord" /> Entra nel Discord
          </a>
        </div>

        <div className="reveal mt-14 flex justify-center" style={{ animationDelay: "320ms" }}>
          <div className="glass-card w-full max-w-xs rounded-xl px-6 py-4 text-center">
            <p className="font-display text-xl font-bold text-accent sm:text-2xl">24/7</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Supporto ticket Discord</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-muted-foreground">{text}</p> : null}
    </div>
  );
}

function Features() {
  return (
    <section id="funzioni" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle
        eyebrow="Funzioni"
        title="Tutto quello che serve per dominare"
        text="Ogni modulo è attivabile singolarmente e configurabile in tempo reale dall'overlay in-game."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <article key={f.title} className="glass-card rounded-2xl p-6">
            <div className="glow-ring inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Servers() {
  return (
    <section id="server" className="relative border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionTitle
          eyebrow="Compatibilità"
          title="Server supportati"
          text="Aron Mod è attualmente disponibile per il server indicato qui sotto. La lista verrà aggiornata con l'aggiunta di nuovi server."
        />
        <ul className="mx-auto mt-12 grid max-w-md gap-3">
          <li className="glass-card flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold">
            <Server className="h-4 w-4 shrink-0 text-accent" />
            <a
              href={LINKS.server.url}
              {...EXTERNAL_LINK_PROPS}
              className="inline-flex min-w-0 items-center gap-1.5 truncate transition-colors hover:text-accent"
            >
              <span className="truncate">{LINKS.server.name}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
            <span className="ml-auto shrink-0 rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
              {LINKS.server.status}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Piano 15 giorni",
    price: "8 €",
    duration: "15 giorni di licenza",
    cta: "Acquista 15 giorni",
    highlight: false,
  },
  {
    name: "Piano 30 giorni",
    price: "15 €",
    duration: "30 giorni di licenza",
    cta: "Acquista 30 giorni",
    highlight: true,
  },
];

const planPerks = [
  "Tutte le funzioni della mod incluse",
  "Aggiornamenti costanti inclusi",
  "Assistenza tramite ticket Discord",
];

function Pricing({ openTicket, openGuide }: ModalHandlers) {
  return (
    <section id="prezzi" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle
        eyebrow="Prezzi"
        title="Scegli la tua licenza"
        text="Nessun carrello e nessun pagamento automatico: apri un ticket sul Discord ufficiale e lo staff completa l'acquisto con te."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {plans.map((p) => (
          <article
            key={p.name}
            className={`glass-card relative flex flex-col rounded-2xl p-7 ${
              p.highlight ? "glow-ring border-primary/60" : ""
            }`}
          >
            {p.highlight ? (
              <span className="absolute top-5 right-5 rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold tracking-wider text-accent uppercase">
                Migliore offerta
              </span>
            ) : null}
            <h3 className="font-display text-lg font-bold">{p.name}</h3>
            <p className="mt-4 font-display text-4xl font-bold text-gradient">{p.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{p.duration}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
              {planPerks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {perk}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={openTicket}
              className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display font-bold transition-transform hover:scale-105 ${
                p.highlight
                  ? "bg-[image:var(--gradient-accent)] text-primary-foreground"
                  : "border border-border bg-card/70 text-foreground"
              }`}
            >
              <MessageCircle className="h-5 w-5" /> {p.cta}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={openGuide}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display font-bold transition-colors hover:border-primary"
        >
          <BookOpen className="h-5 w-5 text-accent" /> Come ottenere Aron Mod
        </button>
      </div>
    </section>
  );
}

function Showcase() {
  const shots = [
    { src: shot1, alt: "Overlay di Aron Mod con i moduli attivi" },
    { src: shot2, alt: "Auto farm notturno nella foresta di bambù" },
  ];

  return (
    <section id="media" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle
        eyebrow="Gallery"
        title="Immagini e video dimostrativi"
        text="Guarda Aron Mod in azione: overlay, auto farm e PvP assist registrati in gioco."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <a
          href={LINKS.discordInvite}
          {...EXTERNAL_LINK_PROPS}
          className="glass-card group relative col-span-1 overflow-hidden rounded-2xl lg:col-span-2"
        >
          <img
            src={shot2}
            alt="Anteprima del video dimostrativo di Aron Mod"
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
            <span className="font-display text-lg font-bold">Video demo · Auto farm 1h</span>
            <span className="text-xs text-muted-foreground">Guarda la clip completa su Discord</span>
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

function DownloadSection({ openTicket, openGuide }: ModalHandlers) {
  return (
    <section id="download" className="relative overflow-hidden border-y border-border/60">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase">Loader</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Come ottenere il loader</h2>
          <p className="mt-4 text-muted-foreground">
            Il loader di Aron Mod viene distribuito esclusivamente tramite il Discord ufficiale:
            segui la guida nella tua lingua e lo staff ti indicherà come riceverlo.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {[
              "Windows 10 / 11 · 64 bit",
              "Distribuzione tramite Discord ufficiale",
              "Aggiornamento automatico integrato",
              "Aggiungi un'eccezione nell'antivirus prima dell'avvio",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {i}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openGuide}
              className="glow-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-7 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              <BookOpen className="h-5 w-5" /> Come ottenere Aron Mod
            </button>
            <button
              type="button"
              onClick={openTicket}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display font-bold transition-colors hover:border-primary"
            >
              <ShoppingCart className="h-5 w-5 text-accent" /> Acquista la licenza
            </button>
          </div>
        </div>
        <img
          src={shot3}
          alt="Finestra del loader di Aron Mod"
          loading="lazy"
          width={1280}
          height={800}
          className="glass-card w-full rounded-2xl object-cover"
        />
      </div>
    </section>
  );
}

function Faq({ open, setOpen }: { open: number | null; setOpen: (i: number | null) => void }) {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
      <SectionTitle eyebrow="Supporto" title="Domande frequenti" />
      <div className="mt-10 space-y-3">
        {faq.map((item, i) => {
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

function Support({ openTicket }: ModalHandlers) {
  return (
    <section id="assistenza" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
      <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-60" />
        <div className="relative">
          <span className="glow-ring inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-discord/20">
            <Ticket className="h-6 w-6 text-discord" />
          </span>
          <h2 className="mt-5 text-3xl font-bold">Assistenza tramite ticket Discord</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Apri un ticket nella sezione italiana o inglese del nostro server: lo staff ti segue
            durante l'acquisto e per qualsiasi problema tecnico.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openTicket}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-discord px-7 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105 sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" /> Apri un ticket
            </button>
            <a
              href={LINKS.discordInvite}
              {...EXTERNAL_LINK_PROPS}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 font-display font-bold transition-colors hover:border-primary sm:w-auto"
            >
              <Mail className="h-5 w-5 text-accent" /> Discord ufficiale
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo.url} alt="Logo Aron Mod" width={36} height={36} className="h-9 w-9" />
              <span className="font-display text-lg font-bold">
                ARON<span className="text-gradient"> MOD</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Aron Mod è un progetto indipendente destinato esclusivamente a retro server e server
              privati autorizzati. Non è affiliato, sponsorizzato o approvato da Gameforge o dagli
              sviluppatori di Metin2.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold tracking-wider uppercase">Navigazione</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {[
                ["Funzioni", "#funzioni"],
                ["Server supportati", "#server"],
                ["Loader", "#download"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
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
              Legale e contatti
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#faq" className="transition-colors hover:text-foreground">
                  Termini di servizio
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-foreground">
                  Privacy policy
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-foreground">
                  Politica di rimborso
                </a>
              </li>
              <li>
                <a
                  href={LINKS.ticketIt}
                  {...EXTERNAL_LINK_PROPS}
                  className="transition-colors hover:text-foreground"
                >
                  Ticket assistenza (IT)
                </a>
              </li>
              <li>
                <a
                  href={LINKS.discordInvite}
                  {...EXTERNAL_LINK_PROPS}
                  className="transition-colors hover:text-foreground"
                >
                  Discord ufficiale
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aron Mod. Tutti i diritti riservati.</p>
          <p>Uso a proprio rischio. Vietata la rivendita delle licenze.</p>
        </div>
      </div>
    </footer>
  );
}
