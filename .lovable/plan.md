# Uniformare gli embed Discord dei ticket acquisto

## Obiettivo
Portare al viola AronMod `#9C59FF` tutti gli embed del flusso ticket acquisto IT/EN, mantenendo invariati testi, componenti, logica e dati.

## Intervento
- Individuare l'origine effettiva della barra arancione confrontando payload del bot, messaggi reali nei ticket aperti e autore dei messaggi.
- Applicare `DISCORD_PURPLE` a ogni payload embed AronMod del ticket: apertura/piano, durata, riepilogo, review/staff e fulfillment dove presenti.
- Eseguire una sincronizzazione una tantum sui soli ticket acquisto aperti identificabili con affidabilità, modificando in-place gli embed del bot senza creare o eliminare messaggi.
- Verificare che i pannelli pubblici IT/EN restino viola e unici.
- Eseguire Prettier, ESLint, typecheck e build; nessun deploy.

## Vincoli tecnici
- Nessuna modifica a copy, `custom_id`, prezzi, PayPal.Me, routing, database o sicurezza.
- I messaggi storici vengono aggiornati solo se appartengono al bot AronMod e al flusso acquisto; contenuti di altri bot/integrations non vengono alterati.
- La sincronizzazione userà esclusivamente secret server-side già configurati, senza stamparli o restituirli.
