# Google Wallet pass — spec

Date: 2026-10-05 · Branch: `feat/wallet-google` (from `main` v0.6.0) · Status: **approved** (Iván, 2026-10-05)

Source: the Google Wallet commits on Santiago's `feat/qr-wallet-checkin` (`aa2e59b` through `74446cf`). Santiago tested that flow with a validated issuer and class.

**Revised 2026-10-05 (Iván):** Google only. Apple Wallet and Santiago's iPhone web pass (PWA, service worker) are out of scope.

## Problem

Today the pass is a QR on screen that the runner screenshots. A Google Wallet pass is better on Android:
- it does not get lost in the camera roll;
- it shows up near the event date.

Santiago's branch works, but it cannot be merged as it is:
- **It is built on the old structure** (`app/registro`, `lib/wallet`), from before the feature folders and plan 2.
- **It leaks Google's errors.** The route returns Google's error text (up to 1000 characters) to the browser.
- **It calls `registration-pass` with only the publishable key.** Since plan 2, that function requires the proxy secret, so his call fails on `main`.
- **`/api/wallet/status`** costs an extra request per pass shown, only to decide whether to show a button.

## Decisions

1. **Keep Santiago's Google flow, because it is the one that was validated.** On each tap:
   - get an OAuth token for the service account;
   - read the `eventTicketObject`, and create it with REST if it does not exist (409 counts as success);
   - sign a short save JWT that only references the object;
   - redirect to `https://pay.google.com/gp/v/save/<jwt>`.

   **Change from his version:** the OAuth token is cached in memory until a minute before it expires, so repeated taps skip one call.

   **Rejected:** the "fat JWT" with the object inline (the old spec). It is one call fewer, but nobody has tested it with this issuer, and save links longer than about 1800 characters can fail in some browsers.

2. **Lookup by token, behind the proxy secret.**
   - The `pass` action comes back to `registration-pass`: it checks the UUID, then looks up by `checkin_token` within event `SR26`.
   - Missing and cancelled both answer 404, so the endpoint gives no hint about which tokens exist.
   - Next calls it through `callEdgeFunction`, like `claim`.

3. **The server decides whether to show the button.** `Pass` gains `googleWalletUrl?: string`. It is set when:
   - the three env vars are present;
   - the user agent is not iPhone or iPad (Google Wallet does not work on iOS).

   There is no status endpoint.

4. **The button** sits under the QR:
   - a 48 px link at full width at 390 px, with the `Wallet` icon and the label "Añadir a Google Wallet";
   - the screenshot hint stays, for iPhone and as a fallback.

   It is a plain button like Santiago's, not the official badge artwork, so there is no `public/` folder. If Google's publishing review asks for the official badge, we add it then.

5. **Pass content,** from Santiago's tested object:
   - the runner's name;
   - the code;
   - the QR `NEOTEAM-SR26:<token>`;
   - "5K · Parque del Ingenio y sus alrededores";
   - "18 OCT 2026 · 7:30 a. m.";
   - background `#050505`.

   The event name, logo and date live in the class, which Santiago already created in the console.

6. **Vercel env, server only (never `NEXT_PUBLIC_*`):**
   - `GOOGLE_WALLET_ISSUER_ID`;
   - `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`;
   - `GOOGLE_WALLET_PRIVATE_KEY_BASE64`;
   - `GOOGLE_WALLET_CLASS_SUFFIX` (default `neoteam_social_run_2026`).

   Santiago's `GOOGLE_WALLET_ORIGIN` is dropped: the JWT sends `origins: []`, so it is never used.

**Dropped from Santiago's branch:**
- Apple Wallet and the `apple-wallet-pass` function;
- the iPhone PWA (`manifest.ts`, `sw.js`);
- `/api/wallet/status`;
- `lib/wallet/pass-data.ts`;
- the Google error details in responses.

## Security

- **The token in the link** (`/api/wallet/google?token=…`) is the same secret as the QR, and that QR is already on the runner's screen.
  - The route answers with `Cache-Control: no-store` and logs no query string.
  - Vercel's request log does keep the URL. That is accepted, because the token only allows check-in by staff.
- **The private key** is a Vercel server env var; it never goes in the repo, a `NEXT_PUBLIC_*` variable or chat.
- **Errors:**
  - the server logs the failing stage and HTTP status, never Google's response body;
  - the runner sees a generic Spanish page: "No pudimos añadir el pase a Google Wallet. Usa la captura de tu QR o inténtalo más tarde."

## Go / no-go (Iván, before deploying)

1. **Is the issuer in publishing mode?** In demo mode, only accounts added as testers can save the pass.
2. **The four env vars are set in Vercel** for Preview and Production.
3. **On a real Android phone:**
   - the pass gets added;
   - its QR scans in the check-in section.

## Mobile

- **Button:** 48 px tall, full width at 390 px.
- **Cost:** no client JavaScript; the button is a plain link, and the extra work happens on the server only when it is tapped.
- **iPhone:** the button does not appear, and the screenshot hint stays.

## Out of scope

- Apple Wallet and the iPhone web pass.
- Updating a pass after it is saved (for example, to show check-in).
- Email delivery.
