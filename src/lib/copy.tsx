export type Lang = "it" | "en";

export const copy = {
  it: {
    meta: {
      title: "Aron Mod — Automazione avanzata per Metin2",
      description:
        "Auto Dungeon, FarmBot, Auto Alchimia e controllo remoto tramite Telegram. Scopri tutte le funzioni di Aron Mod.",
      ogTitle: "Aron Mod — Automazione avanzata per Metin2",
      ogDescription:
        "Auto Dungeon, FarmBot, Auto Alchimia e controllo remoto tramite Telegram. Scopri tutte le funzioni di Aron Mod.",
    },
    header: {
      functions: "Funzioni",
      servers: "Server",
      pricing: "Prezzi",
      gallery: "Galleria",
      loader: "Loader",
      faq: "FAQ",
      buy: "🛒 Acquista",
      langIt: "IT",
      langEn: "EN",
    },
    hero: {
      badge: "",
      title: <span className="text-gradient">ARON MOD</span>,
      subtitle: {
        line1: (
          <>
            Domina Metin con <span className="font-bold">AUTO DUNGEON</span>,{" "}
            <span className="font-bold">AUTO ALCHIMIA</span> e{" "}
            <span className="font-bold">FARMBOT</span>.
          </>
        ),
        line2: (
          <>
            Controllo remoto tramite <span className="font-bold">TELEGRAM</span> e molte altre
            funzioni avanzate.
          </>
        ),
      },
      ctaBuy: "Acquista la Mod",
      ctaDiscord: "Entra nel Discord",
      supportValue: "",
      supportLabel: "",
    },
    features: {
      eyebrow: "",
      title: "Funzioni avanzate",
      text: "Attiva i moduli che ti servono per automatizzare il gameplay.",
      items: [
        {
          title: "Auto Dungeon",
          text: "Completa automaticamente i dungeon tramite sequenze ottimizzate.",
        },
        {
          title: "FarmBot",
          text: "Automatizza il farming di Metin e mob con percorsi, range, raccolta automatica, protezione No KS e filtri personalizzabili.",
        },
        {
          title: "Auto Alchimia",
          text: "Crea e raffina automaticamente la tua Alchimia della Pietra del Drago.",
        },
        {
          title: "Utility",
          text: "Captcha Solver, Relogin, Auto Skill, Switch Ammalia, Wall Hack e molte altre funzioni.",
        },
        {
          title: "Anti Ban",
          text: "Funzioni progettate per ridurre il rischio durante l'utilizzo, incluso HWID Spoofer. Nessun sistema può garantire l'assenza di ban.",
        },
        {
          title: "GM Detector",
          text: "Rileva la presenza di membri dello staff e giocatori nelle vicinanze e attiva gli avvisi configurati.",
        },
        {
          title: "Telegram Bot",
          text: "Gestisci e monitora Aron Mod tramite Telegram: avvia o interrompi le funzioni e ricevi avvisi in tempo reale ovunque tu sia.",
        },
        {
          title: "Assistenza Discord",
          text: "Ricevi supporto su Discord per l'acquisto, la configurazione e gli eventuali problemi tecnici.",
        },
      ],
    },
    servers: {
      title: "Server supportati",
      text: "Aron Mod è attualmente disponibile per i server indicati qui sotto. La lista verrà aggiornata con l'aggiunta di nuovi server.",
      updating: "Lista in aggiornamento",
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
      cta: "ACQUISTA",
      base: {
        name: "BASE",
        bestValue: false,
        price15: "15 Giorni - 9€",
        price30: "30 Giorni - 15€",
      },
      plus: {
        name: "PLUS",
        bestValue: true,
        bestValueLabel: "Migliore offerta",
        price15: "15 Giorni - 12€",
        price30: "30 Giorni - 20€",
        includesTitle: "",
        includesIntro: "In base al server, il PLUS include:",
        includes: ["Auto Dungeon", "Auto Alchimia", "Switch Ammalia", "HWID Spoofer"],
      },
      commonPerks: [
        "Funzioni principali incluse",
        "Aggiornamenti costanti inclusi",
        "Assistenza tramite ticket Discord",
      ],
      getMod: "Come ottenere Aron Mod",
      stepsTitle: "Come funziona l'acquisto",
      steps: [
        "Apri il ticket su Discord",
        "Scegli piano e durata",
        "Paga con PayPal",
        "Ricevi la KeyAuth key nel ticket",
      ],
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
        "Verifica della chiave di licenza con opzione «Salva Licenza»",
        "Avvio automatico del client con multi-client integrato",
        "Memorizzazione dei percorsi recenti per avviare più rapidamente il gioco",
        "Aggiornamento automatico e supporto IT / EN nel loader",
      ],
      download: "Download",
      buyLicense: "Acquista la Mod",
    },
    faq: [
      {
        q: "Aron Mod è sicuro da usare?",
        a: "Aron Mod è pensata esclusivamente per retro server e server privati autorizzati. Consigliamo sempre un utilizzo moderato e responsabile, nel rispetto delle regole del server su cui giochi. L'utilizzo della mod avviene sotto la responsabilità esclusiva dell'utente: dopo l'acquisto, Aron Mod e il suo staff non sono responsabili di ban, sospensioni, perdita dell'account, di oggetti o progressi di gioco, né di altri provvedimenti o conseguenze derivanti dal suo utilizzo.",
      },
      {
        q: "Come posso acquistare Aron Mod?",
        a: "Per acquistare Aron Mod dal sito, scegli il piano e la durata, clicca Acquista e verrai reindirizzato al Discord ufficiale. Oppure entra direttamente nel nostro Discord ufficiale, apri un ticket nella sezione Acquista o Buy e segui tutti i passaggi.",
      },
      {
        q: "Posso usarla su più PC?",
        a: "La licenza è legata a un singolo HWID. Puoi richiedere un solo reset per licenza aprendo un ticket sul Discord ufficiale.",
      },
      {
        q: "Come ricevo gli aggiornamenti?",
        a: "Il loader si aggiorna in automatico a ogni avvio. Ti avvisa se è presente un aggiornamento durante l'utilizzo",
      },
    ],
    support: {
      eyebrow: "",
      title: "Supporto",
      ticketTitle: "Assistenza tramite Discord",
      ticketText:
        "Apri un ticket: lo staff ti segue durante l’acquisto e per qualsiasi problema tecnico.",
      ctaTicket: "Apri un ticket",
      ctaDiscord: "Discord ufficiale",
    },
    footer: {
      disclaimer:
        "Aron Mod è un progetto indipendente destinato esclusivamente a retro server e server privati autorizzati. Non è affiliato, sponsorizzato o approvato da Gameforge o dagli sviluppatori di Metin2.",
      navTitle: "Navigazione",
      contactTitle: "Contatti",
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
      gallery: "Gallery",
      loader: "Loader",
      faq: "FAQ",
      buy: "🛒 Buy",
      langIt: "IT",
      langEn: "EN",
    },
    hero: {
      badge: "",
      title: <span className="text-gradient">ARON MOD</span>,
      subtitle: {
        line1: (
          <>
            Dominate Metin with <span className="font-bold">AUTO DUNGEON</span>,{" "}
            <span className="font-bold">AUTO ALCHEMY</span> and{" "}
            <span className="font-bold">FARMBOT</span>.
          </>
        ),
        line2: (
          <>
            Remote control via <span className="font-bold">TELEGRAM</span> and many other advanced
            features.
          </>
        ),
      },
      ctaBuy: "Buy the Mod",
      ctaDiscord: "Join Discord",
      supportValue: "",
      supportLabel: "",
    },
    features: {
      eyebrow: "",
      title: "Advanced Features",
      text: "Activate the modules you need to automate your gameplay.",
      items: [
        {
          title: "Auto Dungeon",
          text: "Automatically completes dungeons using optimized sequences.",
        },
        {
          title: "FarmBot",
          text: "Automates Metin and mob farming with routes, range, auto pickup, No KS protection and customizable filters.",
        },
        {
          title: "Auto Alchemy",
          text: "Automatically creates and refines your Dragon Stone Alchemy.",
        },
        {
          title: "Utility",
          text: "Captcha Solver, Relogin, Auto Skill, Auto Enchant, Wall Hack and many other features.",
        },
        {
          title: "Anti Ban",
          text: "Features designed to reduce risk during use, including HWID Spoofer. No system can guarantee protection from bans.",
        },
        {
          title: "GM Detector",
          text: "Detects nearby staff members and players and triggers your configured alerts.",
        },
        {
          title: "Telegram Bot",
          text: "Manage and monitor Aron Mod through Telegram: start or stop features and receive real-time alerts wherever you are.",
        },
        {
          title: "Discord Support",
          text: "Get support on Discord for purchases, configuration and technical issues.",
        },
      ],
    },
    servers: {
      title: "Supported servers",
      text: "Aron Mod is currently available for the servers listed below. The list will be updated as new servers are added.",
      updating: "List being updated",
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
      cta: "BUY",
      base: {
        name: "BASE",
        bestValue: false,
        price15: "15 Days - €9",
        price30: "30 Days - €15",
      },
      plus: {
        name: "PLUS",
        bestValue: true,
        bestValueLabel: "Best value",
        price15: "15 Days - €12",
        price30: "30 Days - €20",
        includesTitle: "",
        includesIntro: "Depending on the server, PLUS includes:",
        includes: ["Auto Dungeon", "Auto Alchemy", "Auto Enchant", "HWID Spoofer"],
      },
      commonPerks: [
        "Core features included",
        "Constant updates included",
        "Support via Discord ticket",
      ],
      getMod: "How to get Aron Mod",
      stepsTitle: "How the purchase works",
      steps: [
        "Open a ticket on Discord",
        "Choose plan and duration",
        "Pay with PayPal",
        "Get your KeyAuth key in the ticket",
      ],
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
        "License key verification with «Save License» option",
        "Automatic client launch with built-in multi-client",
        "Recent path history for faster game launch",
        "Automatic updates and IT / EN support inside the loader",
      ],
      download: "Download",
      buyLicense: "Buy the Mod",
    },
    faq: [
      {
        q: "Is Aron Mod safe to use?",
        a: "Aron Mod is intended exclusively for retro servers and authorized private servers. We always recommend moderate and responsible use, respecting the rules of the server you play on. Use of the mod is under the sole responsibility of the user: after purchase, Aron Mod and its staff are not responsible for bans, suspensions, loss of account, items or game progress, nor any other measures or consequences resulting from its use.",
      },
      {
        q: "How can I purchase Aron Mod?",
        a: "To purchase Aron Mod from the website, choose your plan and duration, click Buy, and you will be redirected to the official Discord. Alternatively, join our official Discord directly, open a ticket in the Buy or Acquista section, and follow all the steps.",
      },
      {
        q: "Can I use it on multiple PCs?",
        a: "The license is tied to a single HWID. You can request only one reset per license by opening a ticket on the official Discord.",
      },
      {
        q: "How do I receive updates?",
        a: "The loader updates automatically on every launch. It notifies you if an update is available while in use.",
      },
    ],
    support: {
      eyebrow: "",
      title: "Support",
      ticketTitle: "Support via Discord",
      ticketText:
        "Open a ticket: our staff will assist you with your purchase and any technical issues.",
      ctaTicket: "Open a ticket",
      ctaDiscord: "Official Discord",
    },
    footer: {
      disclaimer:
        "Aron Mod is an independent project intended exclusively for retro servers and authorized private servers. It is not affiliated with, sponsored by or endorsed by Gameforge or the Metin2 developers.",
      navTitle: "Navigation",
      contactTitle: "Contact",
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
