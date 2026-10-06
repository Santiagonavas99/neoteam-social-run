# Google Wallet setup

The pass card shows **Añadir a Google Wallet** when the server has the variables below and the visitor is not on iPhone or iPad. Without them the button does not appear. The QR and its screenshot hint still work.

## How it works

1. The button links to `GET /api/wallet/google?token=<checkin_token>`.
2. The route looks up the pass through `registration-pass` (`pass` action, behind the proxy secret).
3. It gets an OAuth token for the service account, cached in memory until a minute before it expires.
4. It creates the `eventTicketObject` over REST if it does not exist yet.
5. It redirects to `https://pay.google.com/gp/v/save/<jwt>`, where the JWT only references the object.

The object's QR is `NEOTEAM-SR26:<checkin_token>`, the same one check-in scans. Its route and meeting time come from `features/event/event.ts`.

## Vercel env (server only, never `NEXT_PUBLIC_*`)

| Variable | Value |
|----------|-------|
| `GOOGLE_WALLET_ISSUER_ID` | Issuer ID from the Google Pay & Wallet Console |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL` | Service account added as a user of the issuer |
| `GOOGLE_WALLET_PRIVATE_KEY_BASE64` | Base64 of the full PEM private key, with the BEGIN/END lines. Mark it Sensitive |
| `GOOGLE_WALLET_CLASS_SUFFIX` | Optional, default `neoteam_social_run_2026` |

Set them for Preview and Production, then redeploy so they take effect.

The Event Ticket class (`<issuer>.<suffix>`) is created once, by hand, in the console. It holds the event name, logo and date.

## Go-live check

1. The issuer is in publishing mode. In demo mode, only test accounts can save the pass.
2. `supabase functions deploy registration-pass --project-ref ohatsnkgaeccltqwhkbv`
3. On a real Android phone, from the Preview:
   - the pass is added;
   - its QR scans in the admin check-in.

## Errors

- The server log shows only `google-wallet <stage> <status>` (the stage is `oauth`, `object-get` or `object-insert`).
- Google's response body never reaches the log or the browser.
- The runner sees a generic Spanish message.
