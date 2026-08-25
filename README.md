# Aron Mod: Master Metin

Crea una landing page moderna e professionale per Aron Mod, una mod per Metin2.

Usa uno stile gaming premium, sfondo scuro nero e blu, effetti luminosi e leggere animazioni.

Inserisci:

- sezione iniziale con logo Aron Mod;

- titolo “Domina Metin con Aron Mod”;

- pulsante “Acquista la mod”;

- pulsante “Entra nel Discord”;

- sezione con tutte le funzioni della mod;

- lista dei server supportati;

- immagini e video dimostrativi;

- sezione download del loader;

- domande frequenti;

- assistenza tramite ticket Discord;

- footer con termini di servizio e contatti.

Il sito deve essere responsive, veloce e visualizzato perfettamente da telefono e computer.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c134ef5-f387-4545-90d6-32fe56e14d6a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Automated purchase setup (PayPal + Discord, KeyAuth manuale)

**Non serve la KeyAuth Seller API.** Le key sono generate **manualmente** nel pannello KeyAuth: questo progetto non è un'autorità di licenza, KeyAuth resta l'unica fonte reale delle key.

Flusso completo:

1. Pannello Discord → il cliente apre un ticket privato.
2. Sceglie pacchetto (BASE / PLUS) e durata (15 / 30 giorni).
3. Riceve un link di checkout su `aronmod.net` e paga con PayPal.
4. Il webhook PayPal verifica il pagamento **server-side**: l'ordine diventa `paid` con `fulfillment_status = pending_key` e nel ticket compare «Pagamento confermato — la KeyAuth key verrà assegnata dallo staff».
5. Lo staff genera la key nel dashboard KeyAuth, clicca **Assegna KeyAuth key** nel ticket e la incolla nel modal Discord.
6. Il bot registra l'assegnazione in modo idempotente e consegna la key nel ticket una sola volta; l'ordine passa a `delivered` e il ruolo cliente viene assegnato.
7. Se Discord fallisce, la key resta cifrata nella outbox: il bottone **Riprova consegna** la reinvia senza chiedere allo staff di reinserirla.

Il link di checkout viene generato dall'origin della richiesta Discord firmata: in sandbox punta alla preview, in produzione ad `aronmod.net`.

### Secrets richiesti (solo NOMI — configurarli in Project Settings → Secrets, mai nel repo)

| Nome | Obbligatorio |
| --- | --- |
| `PAYPAL_CLIENT_ID` | sì |
| `PAYPAL_CLIENT_SECRET` | sì |
| `PAYPAL_WEBHOOK_ID` | sì |
| `PAYPAL_ENV` | sì (`sandbox` o `live`) |
| `PUBLIC_PAYPAL_CLIENT_ID` | sì (client id **pubblico** usato dal checkout; nessun fallback su `PAYPAL_CLIENT_ID`, che resta solo server-side) |
| `DISCORD_APPLICATION_ID` | sì |
| `DISCORD_PUBLIC_KEY` | sì |
| `DISCORD_BOT_TOKEN` | sì |
| `DISCORD_GUILD_ID` | sì |
| `DISCORD_PURCHASE_CHANNEL_ID` | sì — canale pubblico acquisto IT |
| `DISCORD_PURCHASE_CHANNEL_ID_EN` | sì — canale pubblico acquisto EN |
| `DISCORD_TICKET_CATEGORY_ID` | sì |
| `DISCORD_STAFF_ROLE_ID` | **sì** — senza questo ruolo nessuno può assegnare una KeyAuth key (nessun fallback su owner/username) |
| `ADMIN_SETUP_SECRET` | sì (protegge l'endpoint di setup del pannello) |
| `LICENSE_DELIVERY_SECRET` | sì — **valore casuale forte** (≥ 32 caratteri, es. `openssl rand -hex 32`). Chiave AES-GCM per cifrare la KeyAuth key nella coda di consegna. Se cambia, le consegne ancora pendenti non sono più decifrabili. |
| `DISCORD_CUSTOMER_ROLE_ID` | opzionale |
| `DISCORD_STAFF_ALERT_CHANNEL_ID` | opzionale (consigliato: riceve gli alert di rimborso/disputa) |
| `HWID_HASH_SECRET` | **legacy, non utilizzato** dal flusso attuale (restava per il vecchio endpoint di validazione licenze). Può restare configurato senza effetti. |

Nessuna KeyAuth seller key o token è richiesta o supportata.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono già gestiti dalla piattaforma. Nessun secret è mai esposto al frontend.

### Endpoint pubblici

- **Discord Interactions URL**: `https://aronmod.net/api/public/discord-interactions` (verifica sempre `X-Signature-Ed25519` / `X-Signature-Timestamp`; gestisce anche i bottoni staff e il modal della key)
- **PayPal Webhook URL**: `https://aronmod.net/api/public/paypal-webhook` (eventi: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`, `CUSTOMER.DISPUTE.CREATED`)
- **Setup pannello acquisto**: `POST https://aronmod.net/api/public/discord-admin-setup` con header `Authorization: Bearer <ADMIN_SETUP_SECRET>`
- `POST /api/public/license-validate` è **dismesso**: risponde `410 Gone`. Il loader autentica direttamente su KeyAuth.

### Note di sicurezza

- **Sandbox / pre-go-live**: per testare prima del deploy si può puntare l'Interactions URL di Discord verso la preview del progetto. Il link di checkout seguirà automaticamente lo stesso host. Prima della produzione, sostituirlo con `https://aronmod.net/api/public/discord-interactions`.
- I prezzi (BASE 15g 9 €, BASE 30g 15 €, PLUS 15g 12 €, PLUS 30g 20 €) sono risolti solo lato server da una whitelist.
- Token di checkout casuale, salvato solo come SHA-256, valido 30 minuti.
- Verifica webhook PayPal: il body viene ripostato **raw** come `webhook_event` a `/v1/notifications/verify-webhook-signature`, senza parse/reserialize.
- Retry eventi: un evento duplicato con `processed_at` valorizzato risponde 200; se `processed_at` è NULL viene rielaborato (contatore `attempts`, `last_error_code`, `rejected_at`/`reject_reason`).
- `PAYMENT.CAPTURE.COMPLETED` è accettato solo se combaciano `custom_id`, importo, valuta, stato, `supplementary_data.related_ids.order_id` verso `paypal_order_id`, capture id e `final_capture`. Il pagamento **non genera alcuna key interna** e non crea né estende righe in `licenses`.
- Autorizzazione staff: i bottoni `aron_assign_key_*` / `aron_retry_key_delivery_*` e il modal submit verificano server-side che `member.roles` contenga `DISCORD_STAFF_ROLE_ID`. Se il ruolo non è configurato, l'azione viene rifiutata con risposta effimera. La visibilità del bottone non è mai considerata un'autorizzazione.
- Consegna key: la key in chiaro esiste solo nel body del modal e, temporaneamente, cifrata AES-GCM nella outbox `license_deliveries`. Il ciphertext viene azzerato subito dopo l'invio riuscito su Discord. In database restano solo SHA-256 e last4 (`keyauth_assignments`). La key non viene mai loggata.
- Idempotenza assegnazione: `keyauth_assignments.purchase_order_id` è UNIQUE e l'RPC `assign_keyauth_key` rifiuta un secondo inserimento (`already_delivered` / `pending_exists`).
- Rimborso totale / reversal: ordine e assegnazione passano a `revoked` e parte un alert staff esplicito «Revocare manualmente la KeyAuth key ****LAST4 nel pannello KeyAuth». Nessuna revoca automatica è possibile senza Seller API. Rimborso parziale: solo alert manuale.
- Dispute: alert staff con order short id e last4 della key se assegnata, nessuna revoca automatica.
- Tabelle e RPC legacy (`licenses`, `validate_license_hwid`) restano in database non utilizzate, per evitare migrazioni distruttive.
- Tutte le tabelle del flusso acquisti sono RLS deny-by-default (nessuna policy): raggiungibili solo dal codice server con service role.
