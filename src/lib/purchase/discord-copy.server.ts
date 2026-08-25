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
    unsupported: "Non supportato.",
    invalidAction: "Azione non valida.",
    staffOnly:
      "⛔ Azione riservata allo staff.\n_Se sei staff e vedi questo messaggio, `DISCORD_STAFF_ROLE_ID` non è configurato correttamente._",
    orderNotReady: "⚠️ Ordine non trovato o non pagato.",
    alreadyApproved: "ℹ️ Consegna già approvata per questo ordine.",
    approvedEphemeral: "✅ Consegna approvata. Ora puoi assegnare la KeyAuth key.",
    reviewRequiredAssign:
      "🕵️ Ordine in **revisione manuale**: usa prima **Approva consegna (staff)**.",
    reviewRequiredModal:
      "🕵️ Ordine in **revisione manuale**: approva prima la consegna con **Approva consegna (staff)**. Nessuna key è stata salvata.",
    keyAlreadyDelivered: "ℹ️ Key già assegnata e consegnata.",
    keyAlreadyAssigned: "ℹ️ Key già assegnata a questo ordine.",
    keyPending: "ℹ️ Una key è già registrata ma non consegnata. Usa **Riprova consegna**.",
    keyInvalid: "⚠️ Key non valida (8–128 caratteri alfanumerici, `-` `_` `.` `:` `@`).",
    retryDelivered: "✅ Key consegnata nel ticket.",
    retryNothing: "ℹ️ Nessuna consegna pendente per questo ordine.",
    retryNoChannel: "⚠️ Nessun canale ticket associato all'ordine.",
    retryFailed: "⚠️ Consegna fallita. Riprova tra poco.",
    assignDelivered: "✅ Key registrata e consegnata nel ticket.",
    assignDeliveryFailed:
      "⚠️ Key registrata in modo sicuro ma consegna fallita. Usa **Riprova consegna** (non serve reinserirla).",
    staffAssign: "Assegna KeyAuth key (staff)",
    staffRetry: "Riprova consegna (staff)",
    staffApprove: "Approva consegna (staff)",
    modalTitle: "Assegna KeyAuth key",
    modalLabel: "KeyAuth key",
    modalPlaceholder: "Incolla qui la key generata su KeyAuth",
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
    unsupported: "Unsupported.",
    invalidAction: "Invalid action.",
    staffOnly:
      "⛔ Staff-only action.\n_If you are staff and see this message, `DISCORD_STAFF_ROLE_ID` is not configured correctly._",
    orderNotReady: "⚠️ Order not found or not paid.",
    alreadyApproved: "ℹ️ Delivery is already approved for this order.",
    approvedEphemeral: "✅ Delivery approved. You can now assign the KeyAuth key.",
    reviewRequiredAssign:
      "🕵️ Order under **manual review**: use **Approve delivery (staff)** first.",
    reviewRequiredModal:
      "🕵️ Order under **manual review**: approve delivery with **Approve delivery (staff)** first. No key was saved.",
    keyAlreadyDelivered: "ℹ️ Key already assigned and delivered.",
    keyAlreadyAssigned: "ℹ️ Key already assigned to this order.",
    keyPending: "ℹ️ A key is already stored but not delivered. Use **Retry delivery**.",
    keyInvalid: "⚠️ Invalid key (8–128 alphanumeric characters, `-` `_` `.` `:` `@`).",
    retryDelivered: "✅ Key delivered in the ticket.",
    retryNothing: "ℹ️ No pending delivery for this order.",
    retryNoChannel: "⚠️ No ticket channel linked to this order.",
    retryFailed: "⚠️ Delivery failed. Try again shortly.",
    assignDelivered: "✅ Key stored and delivered in the ticket.",
    assignDeliveryFailed:
      "⚠️ Key stored securely but delivery failed. Use **Retry delivery** (no need to paste it again).",
    staffAssign: "Assign KeyAuth key (staff)",
    staffRetry: "Retry delivery (staff)",
    staffApprove: "Approve delivery (staff)",
    modalTitle: "Assign KeyAuth key",
    modalLabel: "KeyAuth key",
    modalPlaceholder: "Paste the KeyAuth-generated key here",
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
