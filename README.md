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

## Automated purchase setup

Flusso: pannello Discord → ticket privato → scelta piano/durata → link `https://aronmod.net/checkout/<token>` → PayPal → verifica server-side → licenza creata/estesa → messaggio nel ticket + ruolo cliente.

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
| `DISCORD_PURCHASE_CHANNEL_ID` | sì |
| `DISCORD_TICKET_CATEGORY_ID` | sì |
| `DISCORD_CUSTOMER_ROLE_ID` | opzionale |
| `DISCORD_STAFF_ROLE_ID` | opzionale |
| `DISCORD_STAFF_ALERT_CHANNEL_ID` | opzionale |
| `ADMIN_SETUP_SECRET` | sì (protegge l'endpoint di setup del pannello) |
| `LICENSE_DELIVERY_SECRET` | sì — **valore casuale forte** (≥ 32 caratteri, es. `openssl rand -hex 32`). Chiave AES-GCM per cifrare la license key nella coda di consegna. Se cambia, le consegne ancora pendenti non sono più decifrabili. |
| `HWID_HASH_SECRET` | sì — **valore casuale forte** (≥ 32 caratteri). Secret HMAC-SHA256 per HWID e per le impronte di rate limiting. Se cambia, tutti i binding HWID esistenti non corrispondono più. |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono già gestiti dalla piattaforma. Nessun secret è mai esposto al frontend.

### Endpoint pubblici

- **Discord Interactions URL**: `https://aronmod.net/api/public/discord-interactions` (verifica sempre `X-Signature-Ed25519` / `X-Signature-Timestamp`)
- **PayPal Webhook URL**: `https://aronmod.net/api/public/paypal-webhook` (eventi: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`, `CUSTOMER.DISPUTE.CREATED`)
- **Validazione licenza (loader)**: `POST https://aronmod.net/api/public/license-validate` con body `{ "license_key": "...", "hwid": "..." }`
- **Setup pannello acquisto**: `POST https://aronmod.net/api/public/discord-admin-setup` con header `Authorization: Bearer <ADMIN_SETUP_SECRET>`

### Note di sicurezza

- I prezzi (BASE 15g 9 €, BASE 30g 15 €, PLUS 15g 12 €, PLUS 30g 20 €) sono risolti solo lato server da una whitelist.
- Token di checkout casuale, salvato solo come SHA-256, valido 30 minuti.
- Fulfillment idempotente (`paypal_event_id` e `paypal_capture_id` UNIQUE + funzione SQL transazionale).
- La license key è mostrata una sola volta nel ticket Discord; in database resta solo lo SHA-256.
- Verifica webhook PayPal: il body viene ripostato **raw** come `webhook_event` a `/v1/notifications/verify-webhook-signature`, senza parse/reserialize.
- Retry eventi: un evento duplicato con `processed_at` valorizzato risponde 200; se `processed_at` è NULL viene rielaborato (contatore `attempts`, `last_error_code`, `rejected_at`/`reject_reason` per i rifiuti auditabili).
- `PAYMENT.CAPTURE.COMPLETED` è accettato solo se combaciano `custom_id`, importo, valuta, stato, `supplementary_data.related_ids.order_id` verso `paypal_order_id`, capture id e `final_capture`. In caso contrario: nessun fulfillment, rifiuto auditabile e alert staff.
- `PAYMENT.CAPTURE.REFUNDED`: il capture id viene ricavato da `related_ids.capture_id` (fallback solo da link `rel=up` su `/v2/payments/captures/<id>`). La licenza è sospesa automaticamente solo se `seller_payable_breakdown.total_refunded_amount` prova un rimborso totale; altrimenti resta attiva con alert staff.
- Consegna key: outbox `license_deliveries` cifrata AES-GCM, creata nella stessa transazione della finalizzazione. Il ciphertext viene azzerato solo dopo l'invio riuscito su Discord; in caso di errore l'evento resta pendente e viene ritentato.
- HWID: HMAC-SHA256 con `HWID_HASH_SECRET`; il check e il primo bind avvengono in un'unica RPC transazionale. Nei log/audit finisce solo un fingerprint di 8 caratteri derivato dall'HMAC.
- Rate limiting `/api/public/license-validate`: 60 richieste/minuto per impronta IP (`CF-Connecting-IP`, fallback prudente) e 20/minuto per impronta della key. Le impronte sono HMAC troncati: nessun IP o key in chiaro nel database. Oltre il limite: HTTP 429 con risposta generica.
- Tutte le tabelle del flusso acquisti sono RLS deny-by-default (nessuna policy): sono raggiungibili solo dal codice server con service role.

