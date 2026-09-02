# Sistema recensioni Discord (stesso bot degli acquisti)

Aggiunge un flusso recensioni moderate al bot esistente, senza toccare in alcun modo il flusso acquisti (ticket, prezzi, PayPal, webhook, antifrode, KeyAuth, staff auth, checkout).

## Causa del "Non supportato"

Verificata nel route handler `src/routes/api/public/discord-interactions.ts`: il POST gestisce solo `type === 1` (PING), `type === 3` (componenti) e `type === 5` (modal submit). Non esiste alcun ramo per `type === 2` (APPLICATION_COMMAND), quindi qualsiasi slash command cade nel fallback finale (riga ~523) che risponde con il messaggio `unsupported`. In più, nel codice non esiste nessuna registrazione di comandi verso l'API Discord (nessun riferimento a `/commands`): `/setup-recensioni` non è nemmeno registrato — se compare nella UI è perché è stato creato altrove, ma il backend non lo gestisce comunque.

## Flusso previsto

```text
/setup-recensioni (staff, nel canale recensioni)
        -> pannello con bottone "📝 Lascia una recensione"
bottone -> modal (voto 1-5 + testo)
submit  -> anti-spam + verifica acquisto pagato
        -> riga review 'pending' su DB
        -> DM al reviewer con identità + ID + bottoni Approva / Rifiuta
Approva -> post pubblico ANONIMO nel canale recensioni (+ "✅ Acquisto verificato")
Rifiuta -> modal motivo opzionale; nessuna pubblicazione, DM di esito all'autore
```

Il messaggio pubblico non contiene mai username, mention o ID dell'autore: solo voto in stelle, testo, data e l'eventuale badge di acquisto verificato. L'identità resta visibile solo al reviewer nel DM e nel DB.

## Verifica acquisto

Riutilizza i dati già presenti: `purchase_orders` con `discord_user_id = autore` e `status = 'paid'`. Se esiste almeno un ordine pagato → badge `✅ Acquisto verificato` nel post pubblico; altrimenti la recensione resta inviabile ma senza badge (configurabile in seguito su richiesta). La lettura avviene lato server con il service client già esistente.

## Anti-spam / duplicati

- Una recensione approvata per utente (nuova richiesta → messaggio "hai già una recensione pubblicata").
- Una sola recensione `pending` per utente alla volta.
- Cooldown via `bump_rate_limit` già esistente (chiave `review:<user_id>`), es. 3 tentativi / 10 min.
- Validazione: voto intero 1-5, testo 20-1000 caratteri, niente link/mention (strip di `@everyone`, `@here`, URL) prima della pubblicazione.

## Dettagli tecnici

**Migration DB** (additiva, nessuna tabella esistente toccata):

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null,
  discord_username text,
  locale text not null default 'it',
  rating int not null check (rating between 1 and 5),
  body text not null,
  purchase_verified boolean not null default false,
  status text not null default 'pending',   -- pending | approved | rejected
  reviewer_discord_id text,
  reviewed_at timestamptz,
  reject_reason text,
  public_message_id text,
  dm_message_id text,
  created_at timestamptz not null default now()
);
create unique index reviews_one_pending_per_user
  on public.reviews (discord_user_id) where status = 'pending';
create unique index reviews_one_approved_per_user
  on public.reviews (discord_user_id) where status = 'approved';
grant all on public.reviews to service_role;   -- deny-by-default come le altre tabelle acquisto
alter table public.reviews enable row level security;
```

Nessuna policy per `anon`/`authenticated`: la tabella è accessibile solo dal service client server-side, coerente con `purchase_orders`.

**Nuovi file**

- `src/lib/reviews/reviews.server.ts` — creazione/approvazione/rifiuto, verifica acquisto, anti-spam.
- `src/lib/reviews/reviews-copy.server.ts` — copy IT/EN (pannello, modal, DM staff, esiti).
- `src/lib/reviews/reviews-discord.server.ts` — builder pannello, modal, embed pubblico anonimo, DM reviewer con bottoni.

**File modificati**

- `src/routes/api/public/discord-interactions.ts`: nuovo ramo `type === 2` per `setup-recensioni` (con controllo staff via `isStaffInteraction`, che già esiste), nuovi custom_id `aron_review_open`, `aron_review_approve_<uuid>`, `aron_review_reject_<uuid>`, e modal `aron_review_modal` / `aron_review_reject_modal`. I rami esistenti restano invariati; il fallback `unsupported` resta come default.
- `src/lib/purchase/discord.server.ts`: aggiunta di due helper REST (`createDM` su `/users/@me/channels`, riuso di `sendChannelMessage`) — solo aggiunte, nessuna modifica alle funzioni esistenti.

Tutte le operazioni lente girano dentro `runAfterResponse` dopo un ACK differito, come già fatto per gli acquisti (il modal e la risposta al comando rispettano il budget di 3s).

**Registrazione dello slash command**

Nuovo endpoint protetto `src/routes/api/public/discord-register-commands.ts`, stesso schema di `discord-admin-setup` (header con `ADMIN_SETUP_SECRET`, confronto timing-safe). Esegue `PUT /applications/{app}/guilds/{guild}/commands` registrando `setup-recensioni` (guild command: attivo subito, niente attesa di propagazione) con `default_member_permissions` impostato su Manage Guild, così il comando è visibile solo allo staff. Va chiamato una volta dopo il deploy della fix.

**Nuovi secrets**

- `DISCORD_REVIEWS_CHANNEL_ID` — canale pubblico recensioni.
- `DISCORD_REVIEW_APPROVER_IDS` — lista di user ID (separati da virgola) che ricevono il DM di approvazione. In alternativa, se preferisci, si usa un singolo `DISCORD_REVIEW_APPROVER_ID`.

Nessun altro secret; `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_STAFF_ROLE_ID`, `ADMIN_SETUP_SECRET` sono già configurati.

## Note

- Il bot deve poter inviare DM al reviewer: se il reviewer ha i DM chiusi, il sistema logga l'errore e la recensione resta `pending` (nessuna perdita di dati); si può recuperare rieseguendo l'invio.
- Nessun deploy live e nessuna modifica a `PAYPAL_ENV` come parte di questo lavoro.
