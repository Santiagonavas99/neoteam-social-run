# Google Wallet: save failure and official button — plan

Spec: [`2026-10-05-google-wallet-fix-design.md`](../specs/2026-10-05-google-wallet-fix-design.md) · Branch: `fix/google-wallet-save` (from `main`) · Status: **waiting for Iván's OK**

## Tasks

### 0. Diagnose (no commit)

- Iván (or me with `vercel logs`, if allowed) opens the Vercel log for the failed `/api/wallet/google` request and copies the `Google Wallet google-wallet <stage> <status>` line.
- Check in the Pay & Wallet Console: issuer ID, the service account is a user, the class `<issuer>.neoteam_social_run_2026` exists, and the issuer mode (demo mode only lets test accounts save).
- If the cause is config (key, permissions, suffix, demo mode): fix it in Vercel/console, redeploy, retest on Android. Task 1 still ships for future failures.
- If it is `object-insert 400`: stop, add the field fix to this plan as task 1b and ask again.

### 1. `fix(wallet): log Google's error status`

- **`features/registration/google-wallet.ts`:** `fail(stage, response)` reads `error.status` from the JSON body (type-guarded, `unknown`) and throws `google-wallet <stage> <http> <ENUM>`; the body is otherwise discarded.
- **`features/registration/google-wallet.test.ts`:** a fake fetch returning 403 `{ error: { status: 'PERMISSION_DENIED', message: 'secret detail' } }` → the error message contains `PERMISSION_DENIED` and not `secret detail`.
- **`docs/wallet-setup.md`:** Errors section shows the new format and the stage → cause table from the spec.
- **Check:** `pnpm test`.

### 2. `feat(registration): official Add to Google Wallet button`

- **`features/registration/add-to-google-wallet-es.svg`:** official `es-419` black button from Google's brand guidelines, unmodified.
- **`features/registration/pass-card.tsx`:** the `<a>` wraps `<img src={badge.src} alt="Añadir a Google Wallet" height={48}>`; drop the `Wallet` icon, black background and hover classes; keep visible focus ring and ≥ 48 px target.
- **`DESIGN.md`:** remove `Wallet` from the icon table; note that the Google Wallet button is official artwork, not tokenized.
- **Checks:**
  - **390×844 first**, then 1440: the pass card from `/registro` and `/pase`, button at 48 px, not stretched, keyboard focus visible;
  - real Android: tap → Google's save sheet → pass added → its QR scans in admin check-in;
  - `pnpm ci:check`.

### 3. `chore(release): 0.8.0`

- `package.json` → 0.8.0 (task 2 is a `feat`). If the admin Tailwind PR merges first, take the next number.
- `CHANGELOG.md`: `## [0.8.0] - <date>` with
  - Changed: "The **Add to Google Wallet** button now uses Google's official artwork."
  - Fixed: "Adding the pass to Google Wallet from Android." (only if task 0 or 1b required a change in this repo; config-only fixes are noted in the PR, not the changelog).
