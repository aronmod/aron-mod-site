// Server-only Discord copy. Every ticket is single-language: the locale comes
// from the entry point / ticket category and is persisted on the ticket + order.

import { formatEur } from "./pricing";

export type Locale = "it" | "en";

export function isLocale(value: unknown): value is Locale {
  return value === "it" || value === "en";
}

export function normalizeLocale(value: unknown): Locale {
  return value === "en" ? "en" : "it";
}

const T = {
  it: {
    panelTitle: "🛒 **Acquista Aron Mod**",
    welcome: (userId: string) => `<@${userId}> 👋 Benvenuto!`,
    choosePlan: "Scegli il pacchetto:",
    planInfo:
      "**BASE** — funzioni principali · **PLUS** — include Auto Dungeon, Auto Alchimia, Switch Ammalia e HWID Spoofer (in base al server).",
    selected: (plan: string) => `Piano selezionato: **${plan.toUpperCase()}**`,
    chooseDays: "Ora scegli la durata:",
    selectedFull: (plan: string, days: number) =>
      `Selezione attuale: **${plan.toUpperCase()}** · **${days} giorni**`,
    changeHint: "Puoi cambiare piano o durata in qualsiasi momento: il riepilogo si aggiorna.",
    planBase: "BASE",
    planPlus: "PLUS",
    days15: "15 giorni",
    days30: "30 giorni",
    pay: "💳 PAGA",
    summary: (ref: string, plan: string, days: number, amountCents: number) =>
      [
        `🧾 **Ordine** \`${ref}\``,
        `Piano: **${plan.toUpperCase()}** · ${days} giorni`,
        `Totale: **${formatEur(amountCents)}**`,
        "⏳ Il link scade tra 30 minuti.",
        "Gli eventuali ordini precedenti non pagati di questo ticket sono stati annullati.",
      ].join("\n"),
    ticketOpened: (channelId: string) => `🎟️ Ticket aperto: <#${channelId}>`,
    ticketFailed: "⚠️ Impossibile aprire il ticket. Contatta lo staff.",
    genericError: "⚠️ Errore temporaneo. Riprova più tardi.",
    userError: "Errore utente.",
    unknownAction: "Azione non riconosciuta.",
    staffOnly: "⛔ Azione riservata allo staff.",
    paidTitle: "✅ **Pagamento confermato**",
    paidLine: (plan: string, days: number, amountCents: number) =>
      `Piano: **${plan.toUpperCase()}** · ${days} giorni · ${formatEur(amountCents)}`,
    paidKeyNote: "🔑 La KeyAuth key verrà assegnata dallo staff in questo ticket.",
    reviewNote:
      "🕵️ **Verifica manuale in corso** — questo pagamento richiede una revisione di sicurezza prima della consegna della KeyAuth key. Nessuna azione richiesta da parte tua: lo staff completerà il controllo al più presto.",
    approvedNote: [
      "✅ **Revisione completata**",
      "La consegna è stata approvata dallo staff: la KeyAuth key verrà assegnata a breve in questo ticket.",
    ].join("\n"),
    keyTitle: "🔑 **KeyAuth key assegnata**",
    keyPlan: (plan: string) => `Piano: **${plan.toUpperCase()}**`,
    keyDuration: (days: number) => `Durata: **${days} giorni**`,
    keySave: "Salvala ora. La key è gestita da KeyAuth.",
    refOrder: "Ordine Aron",
    refCapture: "PayPal Capture",
  },
  en: {
    panelTitle: "🛒 **Buy Aron Mod**",
    welcome: (userId: string) => `<@${userId}> 👋 Welcome!`,
    choosePlan: "Choose your package:",
    planInfo:
      "**BASE** — core features · **PLUS** — includes Auto Dungeon, Auto Alchemy, Switch Bonus and HWID Spoofer (depending on the server).",
    selected: (plan: string) => `Selected plan: **${plan.toUpperCase()}**`,
    chooseDays: "Now choose the duration:",
    selectedFull: (plan: string, days: number) =>
      `Current selection: **${plan.toUpperCase()}** · **${days} days**`,
    changeHint: "You can change plan or duration at any time: the summary updates.",
    planBase: "BASE",
    planPlus: "PLUS",
    days15: "15 days",
    days30: "30 days",
    pay: "💳 PAY",
    summary: (ref: string, plan: string, days: number, amountCents: number) =>
      [
        `🧾 **Order** \`${ref}\``,
        `Plan: **${plan.toUpperCase()}** · ${days} days`,
        `Total: **${formatEur(amountCents)}**`,
        "⏳ The link expires in 30 minutes.",
        "Any previous unpaid order in this ticket has been cancelled.",
      ].join("\n"),
    ticketOpened: (channelId: string) => `🎟️ Ticket opened: <#${channelId}>`,
    ticketFailed: "⚠️ Could not open the ticket. Please contact the staff.",
    genericError: "⚠️ Temporary error. Please try again later.",
    userError: "User error.",
    unknownAction: "Unknown action.",
    staffOnly: "⛔ Staff only.",
    paidTitle: "✅ **Payment confirmed**",
    paidLine: (plan: string, days: number, amountCents: number) =>
      `Plan: **${plan.toUpperCase()}** · ${days} days · ${formatEur(amountCents)}`,
    paidKeyNote: "🔑 Your KeyAuth key will be assigned by the staff in this ticket.",
    reviewNote:
      "🕵️ **Manual review in progress** — this payment requires a security review before the KeyAuth key is delivered. No action needed from you: the staff will complete the check shortly.",
    approvedNote: [
      "✅ **Review completed**",
      "Delivery was approved by the staff: your KeyAuth key will be assigned shortly in this ticket.",
    ].join("\n"),
    keyTitle: "🔑 **KeyAuth key assigned**",
    keyPlan: (plan: string) => `Plan: **${plan.toUpperCase()}**`,
    keyDuration: (days: number) => `Duration: **${days} days**`,
    keySave: "Save it now. The key is managed by KeyAuth.",
    refOrder: "Aron order",
    refCapture: "PayPal capture",
  },
} as const;

export function t(locale: Locale) {
  return T[locale];
}
