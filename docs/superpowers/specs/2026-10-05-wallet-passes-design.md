# Apple and Google Wallet passes — spec

Date: 2026-10-05 · Branch: `feat/wallet-passes` (from `main` after `feat/qr-checkin` is **in production**) · Status: **awaiting OK**

Source: the Wallet commits on Santiago's `feat/qr-wallet-checkin`: `19fb16c` through `9f26e55`, then `aa2e59b` through `d61bac2`.

## Problem

After spec 2, the pass is a QR on screen that the runner screenshots. A Wallet pass is better: it shows up on the lock screen near the event, and it does not get lost in the camera roll.

Santiago's version is not ready to merge:
- **It is unfinished.** The last four commits add diagnostics for a Google Wallet error that was still open: "use existing event class", "create object via REST", then two "diagnostics" commits.
- **A public diagnostic mode.** `GET /api/wallet/google?diagnose=1` reports the issuer and class state from Google to anyone who asks. It goes away.
- **Unsecured endpoints.**
  - The Wallet routes call `registration-pass` and `apple-wallet-pass` with only the publishable key. Spec 2 puts `registration-pass` behind the proxy secret, and `apple-wallet-pass` needs the same.
  - `/api/wallet/status` makes an Edge call on every success card, only to decide whether to show two buttons.
- **External accounts nobody has confirmed yet:**
  - **Apple:** an Apple Developer membership (USD 99 a year), a Pass Type ID, its certificate and key, and the WWDR certificate.
  - **Google:** a Google Wallet issuer account approved for publishing, plus a service account.

  Without them the buttons never appear, and all of this code is dead weight.

## Go / no-go (Iván, before any code)

This plan starts only if **by 12 Oct** both of these are true:
1. **Apple** (if wanted): the membership is active and the Pass Type certificate is exported.
2. **Google** (if wanted): the issuer account is approved for publishing (not demo mode), and the service account is added as a user of the issuer.

Each provider is independent: one can ship without the other. If neither is ready by 12 Oct, this waits until after the event or is dropped. The QR screenshot from spec 2 covers the event.

## Decisions

1. **One lookup by token, behind the proxy secret.**
   - The `pass` action comes back to `registration-pass`: lookup by `checkin_token`, which returns the code, the name and the status.
   - It is called only from Next through `callEdgeFunction` (spec 2).
2. **Google Wallet: a "fat JWT", signed in a Next route.**
   - `GET /api/wallet/google?token=…` looks up the pass and builds the `eventTicketObject` inline in the save JWT.
   - It signs the JWT with RS256 using `node:crypto`, with no dependency, and redirects to `https://pay.google.com/gp/v/save/<jwt>`.
   - Google creates the object when the runner saves it.
   - The event class is created **once**, by hand in the Google Pay & Wallet Console, by Iván. Its ID goes into `GOOGLE_WALLET_CLASS_ID`.
   - **Rejected:** Santiago's flow. It gets an OAuth access token, reads the object, creates it with REST, then signs a JWT that only references it: three calls to Google per tap, and it is where his errors came from. Inline objects are the documented path for "Add to Google Wallet" links.
   - **Vercel env (server only, never `NEXT_PUBLIC_*`):**
     - `GOOGLE_WALLET_ISSUER_ID`;
     - `GOOGLE_WALLET_CLASS_ID`;
     - `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`;
     - `GOOGLE_WALLET_PRIVATE_KEY_BASE64`.
3. **Apple Wallet: signed in the `apple-wallet-pass` Edge Function**, as Santiago did.
   - It uses `npm:passkit-generator` inside Deno, so there is no new dependency in `package.json`.
   - The certificates live only in Supabase secrets.
   - **Added:**
     - the proxy-secret check;
     - the token lookup lives in `supabase/functions/_shared/pass-lookup.ts`, used by both `registration-pass` and `apple-wallet-pass`, so it is written once.
   - `GET /api/wallet/apple?token=…` proxies the `.pkpass` with `Content-Type: application/vnd.apple.pkpass`.
4. **The server decides which buttons to show; there is no status endpoint.**
   - The success card and `/pase` get a `wallets` flag from the server action:
     - `google` is true when its four env vars are set;
     - `apple` is true when `APPLE_WALLET_ENABLED=1` is set in Vercel. Iván sets it after testing a pass.
   - No extra request per page view.
5. **Buttons:**
   - the official "Add to Apple Wallet" and "Add to Google Wallet" badges, in Spanish ("Añadir a Apple Wallet", "Añadir a Google Wallet");
   - placed under the QR;
   - Apple's shown only on iOS and macOS Safari, Google's on the other devices (user-agent check on the server, both shown when unknown). Each brand requires its own badge artwork, kept in `public/wallet/`, the only exception to `DESIGN.md` rule 6 (no inline SVG): brand marks are not icons.

   This needs approval to create a `public/` folder, which is a new top-level folder.
6. **Pass content, in both providers:**
   - "Social Run NeoTeam";
   - the date, 18 Oct 2026, 7:30 a. m.;
   - "Parque del Ingenio";
   - the runner's name;
   - the code;
   - the QR `NEOTEAM-SR26:<token>`;
   - black background, logo, and accent `#02F2F8`.

   The relevant date (Apple `relevantDate`, Google `dateTime.start`) makes it appear on the lock screen the morning of the race.

**Dropped from Santiago's branch:**
- the `diagnose` mode;
- `/api/wallet/status`;
- the REST object creation;
- `lib/wallet/pass-data.ts`, replaced by `callEdgeFunction`.

## Security

- **The token in the Wallet URLs** is the same secret as the QR.
  - It is sent over HTTPS only.
  - The routes set `Cache-Control: no-store` and log no query string.
  - Vercel request logs do show the URL. That is accepted, because the token only allows check-in by staff.
- **Private keys** are Vercel server env (Google) and Supabase secrets (Apple). They are never in the repo, never `NEXT_PUBLIC_*`, never in chat.
- **Errors** are generic Spanish messages. Google's or Apple's error details are logged on the server only.

## Mobile

- **Buttons:** both are 48 px tall, at full width at 390 px.
- **Testing on real phones, before turning a provider on:**
  - Apple: an iPhone with Safari opens the `.pkpass` and adds it;
  - Google: an Android with Chrome opens the save page and adds it.
- **Lock screen:** on the morning of 18 Oct, the pass appears there (Apple: `relevantDate` plus location; Google: the event date).
- **Cost:** no client JavaScript; the buttons are plain links.

## Out of scope

- Updating passes after issue (push updates, the Apple web service).
- Passes for check-in status.
- Email delivery.
