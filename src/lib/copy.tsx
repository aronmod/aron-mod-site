export type Lang = "it" | "en";

export const copy = {
  it: {
    meta: {
      title: "Aron Mod — La mod premium per Metin2 su retro server",
      description:
        "Aron Mod: mod premium per retro server Metin2 autorizzati. Pacchetti BASE e PLUS, server supportati, guide e assistenza tramite ticket sul Discord ufficiale.",
      ogTitle: "Aron Mod — Domina Metin con Aron Mod",
      ogDescription:
        "Auto Dungeon, FarmBot e controllo remoto per retro server Metin2 autorizzati. Pacchetti BASE e PLUS, guide e ticket sul Discord ufficiale.",
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
      badge: "",
      title: (
        <>
          Domina Metin con <span className="text-gradient">Aron Mod</span>
        </>
      ),
      subtitle: (
        <span className="block text-base leading-relaxed font-medium text-foreground/90 sm:text-lg">
          <span className="text-gradient font-semibold">Auto Dungeon</span>,{" "}
          <span className="text-gradient font-semibold">FarmBot</span>,{" "}
          <span className="text-gradient font-semibold">Auto Alchimia</span>, controllo remoto
          tramite <span className="text-gradient font-semibold">Telegram</span> e molte altre
          funzioni avanzate.
        </span>
      ),
      ctaBuy: "Acquista la mod",
      ctaDiscord: "Entra nel Discord",
      supportValue: "",
      supportLabel: "",
    },
    features: {
      eyebrow: "",
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
      filtersLabel: "Filtri:",
      filters: {
        all: "Tutti",
        autoDungeon: "Auto Dungeon",
        switchAmmalia: "Switch Ammalia",
        autoAlchimia: "Auto Alchimia",
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
      eyebrow: "",
      title: "Scegli il tuo piano",
      subtitle:
        "Scegli il piano, clicca su Acquista e completa l'acquisto con il nostro staff su Discord.",
      base: {
        name: "BASE",
        bestValue: false,
        cta15: "Acquista 15 giorni — 9 €",
        cta30: "Acquista 30 giorni — 15 €",
      },
      plus: {
        name: "PLUS",
        bestValue: true,
        bestValueLabel: "Migliore offerta",
        cta15: "Acquista 15 giorni — 11 €",
        cta30: "Acquista 30 giorni — 20 €",
        includesTitle: "",
        includesIntro: "In base al server, il PLUS include:",
        includes: ["Auto Dungeon", "Auto Alchimia", "Switch Ammalia", "HWID Spoofer"],
      },
      commonPerks: [
        "Tutte le funzioni della mod incluse",
        "Aggiornamenti costanti inclusi",
        "Assistenza tramite ticket Discord",
      ],
      getMod: "Come ottenere Aron Mod",
    },
    showcase: {
      eyebrow: "",
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
      eyebrow: "",
      title: "Il loader di Aron Mod",
      description:
        "Un'interfaccia essenziale in italiano e inglese: inserisci la chiave di licenza, avvia il client e tieni sotto controllo la scadenza del tuo piano. Il download avviene esclusivamente tramite il Discord ufficiale.",
      specs: [
        "Windows 10 / 11 · 64 bit",
        "Verifica della chiave di licenza con opzione «Memorizza key»",
        "Avvio automatico del client con multi-client integrato",
        "Memorizzazione dei percorsi recenti per avviare più rapidamente il gioco",
        "Aggiornamento automatico e supporto IT / EN nel loader",
      ],
      download: "Download",
      buyLicense: "Acquista la licenza",
    },
    faq: [
      {
        q: "Aron Mod è sicuro da usare?",
        a: "Aron Mod è pensata esclusivamente per retro server e server privati autorizzati. Consigliamo sempre un utilizzo moderato e responsabile, nel rispetto delle regole del server su cui giochi. L'utilizzo della mod avviene sotto la responsabilità esclusiva dell'utente: dopo l'acquisto, Aron Mod e il suo staff non sono responsabili di ban, sospensioni, perdita dell'account, di oggetti o progressi di gioco, né di altri provvedimenti o conseguenze derivanti dal suo utilizzo.",
      },
      {
        q: "Come funziona l'acquisto?",
        a: "Per acquistare Aron Mod, entra nel nostro Discord ufficiale e apri un ticket nella sezione italiana o inglese. Lo staff ti fornirà tutte le informazioni necessarie e ti guiderà durante l'acquisto.",
      },
      {
        q: "Posso usarla su più PC?",
        a: "La licenza è legata a un singolo HWID. Puoi richiedere un reset gratuito al mese aprendo un ticket sul Discord ufficiale.",
      },
      {
        q: "Come ricevo gli aggiornamenti?",
        a: "Il loader si aggiorna in automatico a ogni avvio. Le patch note vengono pubblicate nel canale #changelog del Discord.",
      },
    ],
    support: {
      eyebrow: "",
      title: "Supporto",
      ticketTitle: "Assistenza tramite Discord",
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
        ["Lista server", "#server"],
        ["Prezzi", "#prezzi"],
        ["Galleria", "#galleria"],
        ["Loader", "#download"],
        ["Supporto", "#faq"],
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
        "Auto Dungeon, FarmBot and remote control for authorized Metin2 retro servers. BASE and PLUS packages, guides and ticket support on the official Discord.",
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
      badge: "",
      title: (
        <>
          Dominate Metin with <span className="text-gradient">Aron Mod</span>
        </>
      ),
      subtitle: (
        <span className="block text-base leading-relaxed font-medium text-foreground/90 sm:text-lg">
          <span className="text-gradient font-semibold">Auto Dungeon</span>,{" "}
          <span className="text-gradient font-semibold">FarmBot</span>,{" "}
          <span className="text-gradient font-semibold">Auto Alchemy</span>, remote control via{" "}
          <span className="text-gradient font-semibold">Telegram</span>, and many other advanced
          features.
        </span>
      ),
      ctaBuy: "Buy the mod",
      ctaDiscord: "Join Discord",
      supportValue: "",
      supportLabel: "",
    },
    features: {
      eyebrow: "",
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
      filtersLabel: "Filters:",
      filters: {
        all: "All",
        autoDungeon: "Auto Dungeon",
        switchAmmalia: "Auto Enchant",
        autoAlchimia: "Auto Alchemy",
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
      eyebrow: "",
      title: "Choose your plan",
      subtitle:
        "Choose your plan, click Buy, and complete your purchase with our staff on Discord.",
      base: {
        name: "BASE",
        bestValue: false,
        cta15: "Buy 15 days — €9",
        cta30: "Buy 30 days — €15",
      },
      plus: {
        name: "PLUS",
        bestValue: true,
        bestValueLabel: "Best value",
        cta15: "Buy 15 days — €11",
        cta30: "Buy 30 days — €20",
        includesTitle: "",
        includesIntro: "Depending on the server, PLUS includes:",
        includes: ["Auto Dungeon", "Auto Alchemy", "Auto Enchant", "HWID Spoofer"],
      },
      commonPerks: [
        "All mod features included",
        "Constant updates included",
        "Support via Discord ticket",
      ],
      getMod: "How to get Aron Mod",
    },
    showcase: {
      eyebrow: "",
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
      eyebrow: "",
      title: "The Aron Mod loader",
      description:
        "A clean interface in Italian and English: enter your license key, launch the client and keep track of your plan's expiration. Download is only available through the official Discord.",
      specs: [
        "Windows 10 / 11 · 64 bit",
        "License key verification with «Remember key» option",
        "Automatic client launch with built-in multi-client",
        "Recent path history for faster game launch",
        "Automatic updates and IT / EN support inside the loader",
      ],
      download: "Download",
      buyLicense: "Buy the license",
    },
    faq: [
      {
        q: "Is Aron Mod safe to use?",
        a: "Aron Mod is intended exclusively for retro servers and authorized private servers. We always recommend moderate and responsible use, respecting the rules of the server you play on. Use of the mod is under the sole responsibility of the user: after purchase, Aron Mod and its staff are not responsible for bans, suspensions, loss of account, items or game progress, nor any other measures or consequences resulting from its use.",
      },
      {
        q: "How does the purchase work?",
        a: "To buy Aron Mod, join our official Discord and open a ticket in the Italian or English section. Our staff will provide all the necessary information and guide you through the purchase.",
      },
      {
        q: "Can I use it on multiple PCs?",
        a: "The license is tied to a single HWID. You can request one free reset per month by opening a ticket on the official Discord.",
      },
      {
        q: "How do I receive updates?",
        a: "The loader updates automatically on every launch. Patch notes are posted in the #changelog channel on Discord.",
      },
    ],
    support: {
      eyebrow: "",
      title: "Support",
      ticketTitle: "Support via Discord",
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
        ["Server list", "#server"],
        ["Pricing", "#prezzi"],
        ["Gallery", "#galleria"],
        ["Loader", "#download"],
        ["Support", "#faq"],
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
