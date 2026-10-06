# Google Wallet pass — plan

Spec: [`2026-10-05-wallet-passes-design.md`](../specs/2026-10-05-wallet-passes-design.md) · Branch: `feat/wallet-google` · Status: **awaiting OK** · Revised 2026-10-05: Google only.

## Tasks

### 1. `feat(edge): pass lookup by token`

- **`supabase/functions/registration-pass/index.ts`:**
  - `pass` action: UUID check, then `checkin_token` within event `SR26`;
  - missing or cancelled both return 404;
  - returns the same fields as `claim`.
- **`features/registration/pass.ts`:**
  - `passByToken(token)` through `callEdgeFunction`;
  - `toPass()` shared with `claimPass`.
- **Check:** Biome and `pnpm test`.

### 2. `feat(wallet): Google Wallet save link`

- **`features/registration/google-wallet.ts`** (server only), ported from Santiago's route:
  - `signJwt`;
  - `walletObject(pass, env)`;
  - `accessToken()`, cached in memory until a minute before it expires;
  - `ensureObject()`, where a 409 counts as success;
  - `googleSaveUrl(pass, env)`.
  - Errors are thrown with the stage and the status only.
- **`features/registration/google-wallet.test.ts`**, with an RSA key generated in the test:
  - the JWT signature verifies with the public key, and the header is `RS256`;
  - the object ID is `<issuer>.<suffix>_<token without dashes>`, and the QR value is `NEOTEAM-SR26:<token>`;
  - the save JWT references only `id` and `classId`;
  - `googleWalletConfig(env)` returns null when any of the three vars is missing.
- **`app/api/wallet/google/route.ts`:** `GET ?token=`.
  - Returns 404 when Google is not configured, and 400 when the token is not a UUID.
  - Otherwise: `passByToken`, then `googleSaveUrl`, then a 302 redirect.
  - Any failure returns the spec's generic Spanish message as text, with status 502.
  - Every response sets `Cache-Control: no-store`.
- **`.env.example`:** the four `GOOGLE_WALLET_*` variables.
- **Check:** `pnpm test`.

### 3. `feat(registration): Add to Google Wallet button`

- **`features/registration/wallet.ts`:** `isAppleMobile(userAgent)`; its test covers iPhone, iPad, iPadOS reporting as Mac with touch, Android and desktop.
  - Since the user agent cannot tell an iPadOS desktop-mode iPad from a Mac, iPadOS falls into the "show" case. On iPad the link opens Google's page, which explains that Wallet is not supported. That is accepted.
- **`features/registration/pass.ts`:** sets `googleWalletUrl` when `googleWalletConfig(process.env)` is set and the user agent (`headers()`) is not Apple mobile.
- **`features/registration/pass-card.tsx`:**
  - the link under the code: 48 px, full width, black, white text, `Wallet` icon, "Añadir a Google Wallet";
  - visible focus.
- **`DESIGN.md`:** add `Wallet` = "Add to Google Wallet" to the icon vocabulary.
- **`docs/wallet-setup.md`:** the Google section from Santiago's doc, updated (no `ORIGIN`, the go/no-go list).
- **Checks:**
  - **390×844 first**, then 1440: the pass card with and without the button, from both `/registro` and `/pase`;
  - the button is 48 px tall;
  - `pnpm ci:check`.

### 4. `chore(release): 0.7.0`

- `package.json` goes to 0.7.0.
- `CHANGELOG.md` gains `## [0.7.0] - <date>`, with Added: "**Add your pass to Google Wallet** from the registration confirmation and Mi pase (Android).".
- If the admin Tailwind PR merges first, this takes the next number.

### 5. Deploy (Iván)

- `supabase functions deploy registration-pass --project-ref ohatsnkgaeccltqwhkbv`
- Set the four env vars in Vercel, for Preview and Production.
- Run the spec's go / no-go on a real Android phone using the Preview.
- Close Santiago's `feat/qr-wallet-checkin` once this is merged.

## Done when

- `pnpm ci:check` passes.
- A real Android phone adds the pass, and its QR scans in check-in.
- The branch stays local until Iván says to push it.
