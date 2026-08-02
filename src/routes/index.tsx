import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Crosshair,
  Zap,
  ShieldCheck,
  Bot,
  Radar,
  Swords,
  Gauge,
  Boxes,
  Download,
  MessageCircle,
  ShoppingCart,
  Play,
  ChevronDown,
  Ticket,
  Mail,
  Server,
} from "lucide-react";

import logo from "@/assets/aron-logo.png.asset.json";
import heroBg from "@/assets/hero-bg.jpg";
import shot1 from "@/assets/shot-1.jpg";
import shot2 from "@/assets/shot-2.jpg";
import shot3 from "@/assets/shot-3.jpg";

const DISCORD_URL = "https://discord.gg/aronmod";
const BUY_URL = "https://discord.gg/aronmod";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aron Mod — Domina Metin2 con la mod definitiva" },
      {
        name: "description",
        content:
          "Aron Mod: la mod premium per Metin2 con auto farm, ESP, bot intelligente e anti-detect. Funzioni, server supportati, download del loader e supporto Discord 24/7.",
      },
      { property: "og:title", content: "Aron Mod — Domina Metin2" },
      {
        property: "og:description",
        content:
          "Auto farm, ESP, bot e anti-detect per Metin2. Scarica il loader e entra nel Discord di Aron Mod.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Bot,
    title: "Auto Farm Intelligente",
    text: "Farming automatico di metin, mob e boss con rotte personalizzabili e ritorno al villaggio quando l'inventario è pieno.",
  },
  {
    icon: Radar,
    title: "ESP & Radar",
    text: "Visualizza mob, giocatori, drop e metin attraverso muri e alberi, con filtri per rarità e distanza.",
  },
  {
    icon: Crosshair,
    title: "Auto Attack & Combo",
    text: "Combo perfette al millisecondo, target switching automatico e gestione delle skill in base al cooldown.",
  },
  {
    icon: Zap,
    title: "Speed & Movement",
    text: "Controllo preciso di velocità di movimento e attacco, teleport ottimizzato e pathfinding fluido.",
  },
  {
    icon: Boxes,
    title: "Auto Pickup & Filtri",
    text: "Raccolta automatica del drop con whitelist e blacklist degli oggetti per non sprecare spazio.",
  },
  {
    icon: ShieldCheck,
    title: "Anti-Detect",
    text: "Iniezione stealth, randomizzazione dei pattern e bypass aggiornato costantemente contro i sistemi anti-cheat.",
  },
  {
    icon: Gauge,
    title: "FPS Boost",
    text: "Rendering ottimizzato e rimozione degli effetti superflui: gioco più leggero anche su PC datati.",
  },
  {
    icon: Swords,
    title: "PvP Assist",
    text: "Tracking avversari, alert su avvicinamento e reazioni automatiche pensate per l'arena e le guerre di gilda.",
  },
];

const servers = [
  "Metin2 Official IT",
  "Metin2 Official DE",
  "Metin2 Official TR",
  "Metin2 Official EN",
  "Metin2 Official FR",
  "Metin2 Official ES",
  "Metin2 Official PL",
  "Metin2 Official RO",
  "Server privati 2013+",
  "Server privati Old School",
  "Server privati Custom",
  "Client 40k / 2089",
];

const faq = [
  {
    q: "Aron Mod è sicuro da usare?",
    a: "Aron Mod utilizza un sistema di iniezione stealth con pattern randomizzati e viene aggiornato costantemente. Nessuna mod può garantire il 100% di sicurezza, ma consigliamo sempre un uso moderato e responsabile.",
  },
  {
    q: "Come funziona l'acquisto?",
    a: "Dopo l'acquisto ricevi una chiave di licenza legata al tuo HWID. Inserisci la chiave nel loader e sei pronto a giocare in meno di due minuti.",
  },
  {
    q: "Su quali server funziona?",
    a: "Aron Mod supporta i server ufficiali e la maggior parte dei server privati. Trovi la lista completa nella sezione Server supportati, aggiornata a ogni release.",
  },
  {
    q: "Posso usarla su più PC?",
    a: "La licenza è legata a un singolo HWID. Puoi richiedere un reset gratuito al mese aprendo un ticket sul Discord ufficiale.",
  },
  {
    q: "Quali sono i requisiti?",
    a: "Windows 10 o 11 a 64 bit, client Metin2 aggiornato e antivirus configurato con un'eccezione per il loader.",
  },
  {
    q: "Come ricevo gli aggiornamenti?",
    a: "Il loader si aggiorna in automatico a ogni avvio. Le patch note vengono pubblicate nel canale #changelog del Discord.",
  },
];

function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Servers />
        <Showcase />
        <DownloadSection />
        <Faq open={openFaq} setOpen={setOpenFaq} />
        <Support />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
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
            <a href="#download" className="transition-colors hover:text-foreground">
              Download
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </div>
          <a
            href={BUY_URL}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Acquista
          </a>
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
          <ShieldCheck className="h-3.5 w-3.5" /> Undetected · v4.2
        </p>

        <h1
          className="reveal mt-6 text-4xl leading-tight font-bold sm:text-6xl"
          style={{ animationDelay: "140ms" }}
        >
          Domina Metin con <span className="text-gradient">Aron Mod</span>
        </h1>

        <p
          className="reveal mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "200ms" }}
        >
          La mod premium per Metin2: auto farm, ESP, bot avanzato e protezione anti-detect in
          un'unica interfaccia, leggera e aggiornata ogni settimana.
        </p>

        <div
          className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "260ms" }}
        >
          <a
            href={BUY_URL}
            className="glow-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-7 py-3.5 font-display text-base font-bold text-primary-foreground transition-transform hover:scale-105 sm:w-auto"
          >
            <ShoppingCart className="h-5 w-5" /> Acquista la mod
          </a>
          <a
            href={DISCORD_URL}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display text-base font-bold text-foreground transition-all hover:border-discord hover:bg-discord/15 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5 text-discord" /> Entra nel Discord
          </a>
        </div>

        <dl
          className="reveal mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4"
          style={{ animationDelay: "320ms" }}
        >
          {[
            ["12.000+", "Utenti attivi"],
            ["99.9%", "Uptime loader"],
            ["24/7", "Supporto ticket"],
          ].map(([value, label]) => (
            <div key={label} className="glass-card rounded-xl px-3 py-4">
              <dt className="font-display text-xl font-bold text-accent sm:text-2xl">{value}</dt>
              <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dd>
            </div>
          ))}
        </dl>
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
          text="Lista aggiornata a ogni release. Non trovi il tuo server? Richiedi il supporto su Discord."
        />
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => (
            <li
              key={s}
              className="glass-card flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold"
            >
              <Server className="h-4 w-4 shrink-0 text-accent" />
              <span className="min-w-0 truncate">{s}</span>
              <span className="ml-auto shrink-0 rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                OK
              </span>
            </li>
          ))}
        </ul>
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
          href={DISCORD_URL}
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

function DownloadSection() {
  return (
    <section id="download" className="relative overflow-hidden border-y border-border/60">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase">Loader</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Scarica il loader di Aron Mod</h2>
          <p className="mt-4 text-muted-foreground">
            Un solo eseguibile: avvia, inserisci la licenza e il gioco parte già moddato. Il loader
            si aggiorna da solo a ogni nuova release.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {[
              "Windows 10 / 11 · 64 bit",
              "Versione 4.2 · 8.4 MB",
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
            <a
              href={DISCORD_URL}
              className="glow-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-accent)] px-7 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              <Download className="h-5 w-5" /> Scarica il loader
            </a>
            <a
              href={BUY_URL}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-3.5 font-display font-bold transition-colors hover:border-primary"
            >
              <ShoppingCart className="h-5 w-5 text-accent" /> Acquista la licenza
            </a>
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

function Support() {
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
            Apri un ticket nel canale <strong className="text-foreground">#supporto</strong> del
            nostro server: lo staff risponde in media entro 15 minuti, tutti i giorni, anche di
            notte.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={DISCORD_URL}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-discord px-7 py-3.5 font-display font-bold text-primary-foreground transition-transform hover:scale-105 sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" /> Apri un ticket
            </a>
            <a
              href="mailto:support@aronmod.com"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 font-display font-bold transition-colors hover:border-primary sm:w-auto"
            >
              <Mail className="h-5 w-5 text-accent" /> support@aronmod.com
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
              Aron Mod è un progetto indipendente e non è affiliato, sponsorizzato o approvato da
              Gameforge o dagli sviluppatori di Metin2.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold tracking-wider uppercase">Navigazione</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {[
                ["Funzioni", "#funzioni"],
                ["Server supportati", "#server"],
                ["Download", "#download"],
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
                  href="mailto:support@aronmod.com"
                  className="transition-colors hover:text-foreground"
                >
                  support@aronmod.com
                </a>
              </li>
              <li>
                <a href={DISCORD_URL} className="transition-colors hover:text-foreground">
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
