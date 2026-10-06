# Google Wallet: save failure and official button — spec

Date: 2026-10-05 · Branch: `fix/google-wallet-save` (from `main` v0.7.0) · Status: **draft, waiting for Iván's OK**

Follows [`2026-10-05-wallet-passes-design.md`](2026-10-05-wallet-passes-design.md).

## Problem

1. **Saving fails on a real Android phone.** The tap ends on our text page: "No pudimos añadir el pase a Google Wallet. Usa la captura de tu QR o inténtalo más tarde."
   - That text is only returned from the `catch` in `app/api/wallet/google/route.ts` (status 502). So the pass lookup worked (otherwise it is "No encontramos este pase."), and the failure is inside `googleSaveUrl()`.
   - The three possible stages, all logged as `Google Wallet google-wallet <stage> <status>`:
     - `oauth <status>`: the private key or the service account email is wrong. A malformed PEM throws earlier, inside `createSign`, with a crypto message instead.
     - `object-get 401/403`: the service account is not a user of the issuer, or the Wallet API is not enabled in its Google Cloud project.
     - `object-insert 400/404`: the class `<issuer>.<suffix>` does not exist under that issuer (suffix differs from the one created in the console), or a field in the object is rejected.
   - The log line has the stage and status only, not Google's reason, so a 400 cannot be told apart without guessing.
2. **The button does not look like Google Wallet.** It is a black button with a generic `Wallet` (lucide) icon. Runners do not recognize it, and Google's brand guidelines ask for the official "Add to Google Wallet" button artwork; the publishing review can require it.

## Decisions

1. **Diagnose before fixing.** Read the Vercel function log for the failed tap (`/api/wallet/google`) and note the stage and status. The fix follows the stage:
   - `oauth` / crypto error → re-encode the key (`base64 -i key.pem`, full PEM with BEGIN/END lines) and the email in Vercel, redeploy. Config only.
   - `object-get 401/403` → add the service account as a user of the issuer in the Pay & Wallet Console and enable the Google Wallet API in its Cloud project. Config only.
   - `object-insert 404` / class not found → align `GOOGLE_WALLET_CLASS_SUFFIX` with the class that exists in the console (or create it there). Config only.
   - `object-insert 400` with a field error → fix `walletObject()` in code, with a test.
2. **Log Google's reason code, never its body.** On a non-OK response, read `error.status` (an enum such as `PERMISSION_DENIED`, `NOT_FOUND`, `INVALID_ARGUMENT`) from Google's JSON and add it to the thrown error: `google-wallet object-insert 400 INVALID_ARGUMENT`. The enum carries no personal data; `error.message` and the rest of the body still never reach logs or the browser. This keeps the next failure diagnosable in one look.
3. **Official button artwork.** Replace the lucide icon + text with Google's official "Add to Google Wallet" button, Spanish (Latin America, `es-419`) variant, black, as downloaded from Google's brand guidelines page, unmodified.
   - Kept as an SVG file next to the card (`features/registration/add-to-google-wallet-es.svg`), imported statically and rendered with `<img>` inside the existing `<a>`. No `public/` folder (a new top-level folder needs approval), no new dependency.
   - Accessible name stays "Añadir a Google Wallet" (`alt` on the image).
   - `Wallet` leaves the lucide vocabulary in `DESIGN.md`; a note says the Google Wallet button is the official artwork and is not restyled with `--neo-*` tokens.

### Rejected

- **Auto-creating the class over REST when missing.** It hides a misconfiguration and the class holds the event logo/name, which belong in the console. Revisit only if the diagnosis says the class is missing and creating it by hand is blocked.
- **Logging Google's full error body.** Breaks the rule from the previous spec; the status enum is enough.
- **Drawing our own Google Wallet logo.** Brand guidelines forbid altered marks.

## Mobile

- 390 px first: the official button at its native aspect ratio, height 48 px, centered, never stretched to full width (the artwork has fixed proportions); touch target ≥ 48 px through the `<a>`.
- Then 1024 and 1440: same size.
- The SVG is a few KB, no JS: no measurable 4G cost.

## Security

- No change to the token flow or the env vars. The private key stays a Vercel server variable, never in the repo or chat.
- The extra log field is a fixed Google enum, not user data or Google's free text.

## Out of scope

- Apple Wallet / iPhone.
- Moving the object into a "fat JWT".
- Emailing the pass.
