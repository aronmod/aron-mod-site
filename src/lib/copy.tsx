import { LINKS } from "@/config/links";

export type Lang = "it" | "en";

export const copy = {
  it: {
    meta: {
      title: "Aron Mod — La mod premium per Metin2 su retro server",
      description:
        "Aron Mod: mod premium per retro server Metin2 autorizzati. Pacchetti BASE e PLUS, server supportati, guide e assistenza tramite ticket sul Discord ufficiale.",
      ogTitle: "Aron Mod — Domina Metin con Aron Mod",
      ogDescription:
        "AutoDungeon, FarmBot e controllo remoto per retro server Metin2 autorizzati. Pacchetti BASE e PLUS, guide e ticket sul Discord ufficiale.",
    },
    header: {
      functions: "Funzioni",
      servers: "Server",
      pricing: "Prezzi",
      loader: "Loader",
      faq: "FAQ",
      buy: "Acquista",
      langIt: "IT",
      langEn: "EN",
    },
    hero: {
      badge: "Solo retro server autorizzati",
      title: (
        <>
          Domina Metin con <span className="text-gradient">Aron Mod</span>
        </>
      ),
      subtitle: (
        <>
          La mod premium per i retro server di Metin2:{" "}
          <span className="text-gradient">AutoDungeon</span>,{" "}
          <span className="text-gradient">FarmBot</span>, gestione da remoto con{" "}
          <span className="text-gradient">Telegram</span> e bot avanzato in un'unica interfaccia
          leggera e sempre aggiornata.
        </>
      ),
      ctaBuy: "Acquista la mod",
      ctaDiscord: "Entra nel Discord",
      supportValue: "24/7",
      supportLabel: "Supporto ticket Discord",
    },
    features: {
      eyebrow: "Funzioni",
      title: "Tutto quello che serve per dominare",
      text: "Ogni modulo è attivabile singolarmente e configurabile in tempo reale dall'overlay in-game.",
      items: [
        {
          title: "Auto Dungeon",
          text: "Completa i dungeon in automatico con sequenze ottimizzate, gestione delle fasi e ripetizione dei run senza presidiare il PC.",
        },
        {
          title: "Auto Farm",
          text: "Farming automatico di metin, mob e boss con rotte personalizzabili.",
        },
        {
          title: "Anti Ban",
          text: "Comportamenti configurabili con pause e tempistiche naturali, pensati per un utilizzo prudente e responsabile sul server.",
        },
        {
          title: "Controllo Remoto",
          text: "Gestisci e monitora la mod ovunque tu sia: avvio, stop e stato delle sessioni direttamente da Telegram.",
        },
      ],
    },
    servers: {
      title: "Server supportati",
      text: "Aron Mod è attualmente disponibile per i server indicati qui sotto. La lista verrà aggiornata con l'aggiunta di nuovi server.",
      searchPlaceholder: "Cerca server per nome...",
      colStatus: "Status",
      colServer: "Nome server",
      colBase: "Base",
      colPlus: "Plus",
      noResults: "Nessun server trovato",
      noResultsHint: "Prova a modificare la ricerca o azzerare i filtri.",
      baseLabel: "Compatibile con BASE",
      plusLabel: "Compatibile con PLUS",
      notSupported: "Non supportato",
      unknown: "Da verificare",
      reset: "Azzera filtri",
      filtersLabel: "Filtra per funzione",
      filters: {
        all: "Tutti",
        autoDungeon: "AutoDungeon",
        switchAmmalia: "Switch Ammalia",
        autoAlchimia: "AutoAlchimia",
        captcha: "Captcha",
      },
      status: {
        working: "Attivo",
        partial: "Parziale",
        down: "Non disponibile",
        unknown: "Da verificare",
      },
      legendTitle: "Legenda",
      legendYes: "Supportato",
      legendNo: "Non supportato",
    },

    pricing: {
      eyebrow: "Prezzi",
      title: "Scegli il tuo piano",
      subtitle:
        "Nessun carrello e nessun pagamento automatico: seleziona il pacchetto su Discord e lo staff completa l'acquisto con te.",
      base: {
        name: "BASE",
        description: "Licenza standard",
        bestValue: false,
        cta15: "Acquista 15 giorni — 9 €",
        cta30: "Acquista 30 giorni — 15 €",
      },
      plus: {
        name: "PLUS",
        description: "Massima potenza",
        bestValue: true,
        bestValueLabel: "Migliore offerta",
        cta15: "Acquista 15 giorni — 11 €",
        cta30: "Acquista 30 giorni — 20 €",
        includesTitle: "COSA INCLUDE IL PLUS",
        includesIntro: "Rispetto al pacchetto BASE, il PLUS include:",
        includes: ["AutoDungeon", "AutoAlchimia", "SwitchBonus Ammalia"],
      },
      commonPerks: [
        "Tutte le funzioni della mod incluse",
        "Aggiornamenti costanti inclusi",
        "Assistenza tramite ticket Discord",
      ],
      getMod: "Come ottenere Aron Mod",
    },
    showcase: {
      eyebrow: "Gallery",
      title: "Immagini e video dimostrativi",
      text: "Guarda Aron Mod in azione: scopri tutte le sue funzioni.",
      videoLabel: "Video demo · Auto farm 1h",
      videoSub: "Guarda la clip completa su Discord",
      shots: [
        { alt: "Overlay di Aron Mod con i moduli attivi" },
        { alt: "Auto farm notturno nella foresta di bambù" },
      ],
    },
    loader: {
      images: {
        loginAlt: "Schermata di login del loader di Aron Mod",
        loginCaption: "Login con chiave di licenza",
        launchAlt: "Schermata di avvio del client nel loader di Aron Mod",
        launchCaption: "Avvio del client e multi-client",
      },
      eyebrow: "Loader",
      title: "Il loader di Aron Mod",
      description:
        "Un'interfaccia essenziale in italiano e inglese: inserisci la chiave di licenza, avvia il client e tieni sotto controllo la scadenza del tuo piano. Il download avviene esclusivamente tramite il Discord ufficiale.",
      specs: [
        "Windows 10 / 11 · 64 bit",
        "Verifica della chiave di licenza con opzione «Memorizza key»",
        "Avvio automatico del client con multi-client integrato",
        "Aggiornamento automatico e supporto IT / EN nel loader",
      ],
      download: "Download",
      buyLicense: "Acquista la licenza",
    },
    faq: [
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
    ],
    support: {
      eyebrow: "Supporto",
      title: "Domande frequenti",
      ticketTitle: "Assistenza tramite ticket Discord",
      ticketText:
        "Apri un ticket nella sezione italiana o inglese del nostro server: lo staff ti segue durante l'acquisto e per qualsiasi problema tecnico.",
      ctaTicket: "Apri un ticket",
      ctaDiscord: "Discord ufficiale",
    },
    footer: {
      disclaimer:
        "Aron Mod è un progetto indipendente destinato esclusivamente a retro server e server privati autorizzati. Non è affiliato, sponsorizzato o approvato da Gameforge o dagli sviluppatori di Metin2.",
      navTitle: "Navigazione",
      nav: [
        ["Funzioni", "#funzioni"],
        ["Server supportati", "#server"],
        ["Loader", "#download"],
        ["FAQ", "#faq"],
      ],
      legalTitle: "Legale e contatti",
      legal: [
        ["Termini di servizio", "#faq"],
        ["Privacy policy", "#faq"],
        ["Politica di rimborso", "#faq"],
        ["Ticket assistenza (IT)", LINKS.ticketIt],
        ["Discord ufficiale", LINKS.discordInvite],
      ],
      copyright: "© {year} Aron Mod. Tutti i diritti riservati.",
      risk: "Uso a proprio rischio. Vietata la rivendita delle licenze.",
    },
    modals: {
      ticket: {
        title: "Apri un ticket",
        desc: "Scegli la lingua con cui vuoi ricevere assistenza per l'acquisto.",
        join: "Non sei ancora nel nostro Discord?",
        joinLink: "Entra prima nel server.",
        it: "Italiano",
        en: "English",
      },
      guide: {
        title: "Come ottenere la mod",
        desc: "Consulta la guida nella tua lingua e segui le istruzioni pubblicate nel nostro Discord.",
        join: "Non fai ancora parte della community?",
        joinLink: "Entra nel Discord ufficiale.",
        it: "Guida italiana",
        en: "English guide",
      },
      download: {
        title: "Download",
        desc: "Scegli la lingua per accedere al canale di download sul nostro Discord ufficiale.",
        join: "Discord ufficiale:",
        joinLink: "discord.gg/yQMrcWxY",
        it: "Italiano",
        en: "English",
      },
    },
  },
  en: {
    meta: {
      title: "Aron Mod — The premium mod for Metin2 retro servers",
      description:
        "Aron Mod: premium mod for authorized Metin2 retro servers. BASE and PLUS packages, supported servers, guides and ticket support on the official Discord.",
      ogTitle: "Aron Mod — Dominate Metin with Aron Mod",
      ogDescription:
        "AutoDungeon, FarmBot and remote control for authorized Metin2 retro servers. BASE and PLUS packages, guides and ticket support on the official Discord.",
    },
    header: {
      functions: "Features",
      servers: "Servers",
      pricing: "Pricing",
      loader: "Loader",
      faq: "FAQ",
      buy: "Buy",
      langIt: "IT",
      langEn: "EN",
    },
    hero: {
      badge: "Authorized retro servers only",
      title: (
        <>
          Dominate Metin with <span className="text-gradient">Aron Mod</span>
        </>
      ),
      subtitle: (
        <>
          The premium mod for Metin2 retro servers:{" "}
          <span className="text-gradient">AutoDungeon</span>,{" "}
          <span className="text-gradient">FarmBot</span>, remote management via{" "}
          <span className="text-gradient">Telegram</span> and an advanced bot in a lightweight,
          always-updated interface.
        </>
      ),
      ctaBuy: "Buy the mod",
      ctaDiscord: "Join Discord",
      supportValue: "24/7",
      supportLabel: "Discord ticket support",
    },
    features: {
      eyebrow: "Features",
      title: "Everything you need to dominate",
      text: "Every module can be toggled individually and configured in real time from the in-game overlay.",
      items: [
        {
          title: "Auto Dungeon",
          text: "Complete dungeons automatically with optimized sequences, phase management and run repetition without keeping your PC on standby.",
        },
        {
          title: "Auto Farm",
          text: "Automatic farming for metin, mobs and bosses with custom routes.",
        },
        {
          title: "Anti Ban",
          text: "Configurable behavior with pauses and natural timings, designed for prudent and responsible use on the server.",
        },
        {
          title: "Remote Control",
          text: "Manage and monitor the mod from anywhere: start, stop and check session status directly from Telegram.",
        },
      ],
    },
    servers: {
      title: "Supported servers",
      text: "Aron Mod is currently available for the servers listed below. The list will be updated as new servers are added.",
      searchPlaceholder: "Search servers by name...",
      colStatus: "Status",
      colServer: "Server name",
      colBase: "Base",
      colPlus: "Plus",
      noResults: "No servers found",
      noResultsHint: "Try changing your search or clearing the filters.",
      baseLabel: "BASE compatible",
      plusLabel: "PLUS compatible",
      notSupported: "Not supported",
      unknown: "To be confirmed",
      reset: "Clear filters",
      filtersLabel: "Filter by feature",
      filters: {
        all: "All",
        autoDungeon: "AutoDungeon",
        switchAmmalia: "Switch Ammalia",
        autoAlchimia: "AutoAlchimia",
        captcha: "Captcha",
      },
      status: {
        working: "Working",
        partial: "Partial",
        down: "Unavailable",
        unknown: "To be confirmed",
      },
      legendTitle: "Legend",
      legendYes: "Supported",
      legendNo: "Not supported",
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Choose your plan",
      subtitle:
        "No cart and no automatic payment: select the package on Discord and our staff will complete the purchase with you.",
      base: {
        name: "BASE",
        description: "Standard license",
        bestValue: false,
        cta15: "Buy 15 days — €9",
        cta30: "Buy 30 days — €15",
      },
      plus: {
        name: "PLUS",
        description: "Maximum power",
        bestValue: true,
        bestValueLabel: "Best value",
        cta15: "Buy 15 days — €11",
        cta30: "Buy 30 days — €20",
        includesTitle: "WHAT'S INCLUDED IN PLUS",
        includesIntro: "Compared to the BASE package, PLUS includes:",
        includes: ["AutoDungeon", "AutoAlchimia", "SwitchBonus Ammalia"],
      },
      commonPerks: [
        "All mod features included",
        "Constant updates included",
        "Support via Discord ticket",
      ],
      getMod: "How to get Aron Mod",
    },
    showcase: {
      eyebrow: "Gallery",
      title: "Images and demo videos",
      text: "Watch Aron Mod in action: discover all its features.",
      videoLabel: "Demo video · Auto farm 1h",
      videoSub: "Watch the full clip on Discord",
      shots: [
        { alt: "Aron Mod overlay with active modules" },
        { alt: "Night auto farm in the bamboo forest" },
      ],
    },
    loader: {
      images: {
        loginAlt: "Aron Mod loader login screen",
        loginCaption: "Login with your license key",
        launchAlt: "Aron Mod loader client launch screen",
        launchCaption: "Client launch and multi-client",
      },
      eyebrow: "Loader",
      title: "The Aron Mod loader",
      description:
        "A clean interface in Italian and English: enter your license key, launch the client and keep track of your plan's expiration. Download is only available through the official Discord.",
      specs: [
        "Windows 10 / 11 · 64 bit",
        "License key verification with «Remember key» option",
        "Automatic client launch with built-in multi-client",
        "Automatic updates and IT / EN support inside the loader",
      ],
      download: "Download",
      buyLicense: "Buy the license",
    },
    faq: [
      {
        q: "Is Aron Mod safe to use?",
        a: "Aron Mod is designed exclusively for retro servers and authorized private servers. We always recommend moderate and responsible use, respecting the rules of the server you play on.",
      },
      {
        q: "How does the purchase work?",
        a: "To buy Aron Mod, join our official Discord and open a ticket in the Italian or English section. Our staff will provide all the necessary information and guide you through the purchase.",
      },
      {
        q: "Which servers does it work on?",
        a: "Aron Mod is currently available for I-Longju. Visit the Supported servers section to access the server website. Further compatibility will be announced on our official Discord.",
      },
      {
        q: "Can I use it on multiple PCs?",
        a: "The license is tied to a single HWID. You can request one free reset per month by opening a ticket on the official Discord.",
      },
      {
        q: "What are the requirements?",
        a: "Windows 10 or 11 64-bit, updated retro server client and antivirus configured with an exception for the loader.",
      },
      {
        q: "How do I receive updates?",
        a: "The loader updates automatically on every launch. Patch notes are posted in the #changelog channel on Discord.",
      },
    ],
    support: {
      eyebrow: "Support",
      title: "Frequently asked questions",
      ticketTitle: "Support via Discord ticket",
      ticketText:
        "Open a ticket in the Italian or English section of our server: our staff will assist you with the purchase and any technical issue.",
      ctaTicket: "Open a ticket",
      ctaDiscord: "Official Discord",
    },
    footer: {
      disclaimer:
        "Aron Mod is an independent project intended exclusively for retro servers and authorized private servers. It is not affiliated with, sponsored by or endorsed by Gameforge or the Metin2 developers.",
      navTitle: "Navigation",
      nav: [
        ["Features", "#funzioni"],
        ["Supported servers", "#server"],
        ["Loader", "#download"],
        ["FAQ", "#faq"],
      ],
      legalTitle: "Legal and contacts",
      legal: [
        ["Terms of service", "#faq"],
        ["Privacy policy", "#faq"],
        ["Refund policy", "#faq"],
        ["Support ticket (IT)", LINKS.ticketIt],
        ["Official Discord", LINKS.discordInvite],
      ],
      copyright: "© {year} Aron Mod. All rights reserved.",
      risk: "Use at your own risk. Reselling licenses is prohibited.",
    },
    modals: {
      ticket: {
        title: "Open a ticket",
        desc: "Choose the language you want to receive purchase support in.",
        join: "Not in our Discord yet?",
        joinLink: "Join the server first.",
        it: "Italian",
        en: "English",
      },
      guide: {
        title: "How to get the mod",
        desc: "Check the guide in your language and follow the instructions posted in our Discord.",
        join: "Not part of the community yet?",
        joinLink: "Join the official Discord.",
        it: "Italian guide",
        en: "English guide",
      },
      download: {
        title: "Download",
        desc: "Choose a language to access the download channel on our official Discord.",
        join: "Official Discord:",
        joinLink: "discord.gg/yQMrcWxY",
        it: "Italian",
        en: "English",
      },
    },
  },
} as const satisfies Record<Lang, unknown>;
