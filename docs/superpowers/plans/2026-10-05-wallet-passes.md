# Apple and Google Wallet passes — plan

Spec: [`2026-10-05-wallet-passes-design.md`](../specs/2026-10-05-wallet-passes-design.md) · Branch: `feat/wallet-passes` · Order: **4 of 5** (after plan 2 is in production) · Gate: the go / no-go in the spec, by 12 Oct · Needs approval: `public/` folder for the badges.

Each provider ships on its own; skip the tasks of a provider that is not ready.

## Tasks

### 1. `feat(edge): pass lookup by token`

- **`supabase/functions/_shared/pass-lookup.ts`:** lookup by `checkin_token` (UUID check, cancelled → 410), shared by both functions.
- **`supabase/functions/registration-pass/index.ts`:** add the `pass` action back on top of it, behind the proxy secret that spec 2 already added.
- **`features/registration/pass.ts`:** `passByToken(token)` through `callEdgeFunction`.
- **Check:** Biome and `pnpm test`.

### 2. `feat(wallet): Add to Google Wallet`

- **`features/registration/google-wallet.ts`:**
  - `googleSaveUrl(pass, env)` builds the `eventTicketObject` (spec decision 6) and the JWT (`typ: 'savetowallet'`, `payload.eventTicketObjects: [object]`);
  - signs it RS256 with `node:crypto` (`createSign`).
- **`features/registration/google-wallet.test.ts`:** with a test RSA key generated in the test:
  - the JWT has three parts;
  - the header is `RS256`;
  - the payload holds the object with the QR value;
  - the signature verifies with the public key.
- **`app/api/wallet/google/route.ts`:**
  - `GET` with `?token=`;
  - 404 when Google is not configured;
  - `passByToken`, then a 302 redirect to the save URL;
  - generic errors; `Cache-Control: no-store`.
- **Check (Iván, once the class exists and the env vars are set in a preview):** "Añadir a Google Wallet" on a real Android adds the pass, and the QR in Wallet scans in the check-in section.

### 3. `feat(wallet): Add to Apple Wallet`

- **`supabase/functions/apple-wallet-pass/index.ts`:** Santiago's function, plus:
  - the proxy-secret check;
  - the lookup from `_shared/pass-lookup.ts`;
  - no `status` action;
  - pass content as in spec decision 6, with `relevantDate` set to `2026-10-18T07:30:00-05:00`.
- **`app/api/wallet/apple/route.ts`:**
  - `GET` with `?token=`;
  - 404 unless `APPLE_WALLET_ENABLED=1`;
  - proxies the `.pkpass` with its content type;
  - generic errors.
- **Check (Iván, once the secrets are set):** a real iPhone adds the pass from a preview, and it scans in check-in.

### 4. `feat(registration): Wallet buttons on the pass`

- **`features/registration/wallets.ts`:**
  - `availableWallets(env, userAgent)`, returning `{ apple, google }` (spec decisions 4 and 5);
  - its test covers each env combination and the iOS, Android and unknown user agents.
- **`features/registration/actions.ts` and `claim-actions.ts`:** return `wallets`.
- **`features/registration/pass-card.tsx`:** the badges as links under the QR, 48 px, full width at 390 px.
- **`public/wallet/`:** the official Spanish badges for Apple and Google.
- **`docs/wallet-setup.md`:** Santiago's doc, updated to the new env vars (`GOOGLE_WALLET_CLASS_ID`, `APPLE_WALLET_ENABLED`) and with the class set up in the console.
- **`CHANGELOG.md`, Added:** "Añade tu pase a Apple Wallet o Google Wallet.".
- **Checks:**
  - **390×844 first**, then 1440: the pass card with each button combination;
  - `pnpm ci:check`.

### 5. Deploy and clean up (Iván)

- `supabase functions deploy registration-pass apple-wallet-pass`
- Set the env vars and secrets.
- Turn on one provider at a time after its real-phone check.
- Close Santiago's `feat/qr-wallet-checkin` branch once plans 2 and 4 are merged.

## Done when

- `pnpm ci:check` passes.
- Each provider that ships has been added on a real phone and scanned in check-in.
- The branch stays local until Iván says to push it.
