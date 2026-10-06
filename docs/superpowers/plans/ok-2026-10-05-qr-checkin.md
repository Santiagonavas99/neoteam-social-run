# QR pass and check-in — plan

Spec: [`2026-10-05-qr-checkin-design.md`](../specs/2026-10-05-qr-checkin-design.md) · Branch: `feat/qr-checkin` · Order: **2 of 5** · Needs approval: dependencies `qrcode-generator` and `html5-qrcode`; the `checkin_token` migration if the column is missing; Edge deploys.

## Tasks

### 0. Verify the remote (Iván, read-only, no commit)

- Run the two queries in the spec ("State to verify first") and list the deployed Edge Functions.
- Paste the results into the PR. The answer decides whether Task 1 only records the migration or also runs it.
- **Result (2026-10-05):** `checkin_token` exists, `NOT NULL`, default `gen_random_uuid()`, unique index `registrations_checkin_token_key`, 0 rows without a token. Task 1 only records the migration. The remote is still in development, so Task 5 deletes and redeploys the functions without checking first.

### 1. `chore(db): record the checkin_token migration`

- Add `supabase/migrations/20261005195000_add_registration_checkin_token.sql`, copied from Santiago's branch.
- If Task 0 found no column, Iván runs it on the remote. Afterwards, `select count(*) from registrations where checkin_token is null` must return 0.

### 2. `feat(edge): registration-pass behind the proxy secret`

- **`supabase/functions/registration-pass/index.ts`:** Santiago's `claim`, plus:
  - the proxy-secret check copied from `admin-pin`;
  - typed rows instead of `any`;
  - one generic 404 for "not found" and "email does not match".
- Santiago's `pass` action (lookup by token) is left out: only Wallet needs it, and spec 4 adds it.
- **`lib/edge-function.ts`:** `callEdgeFunction(name, body)`, imported only by server actions (the secret is not a `NEXT_PUBLIC_*` variable, so it is never in a client bundle anyway). It uses `adminUpstreamHeaders` and returns `{ status, data }`.
- **`lib/edge-function.test.ts`:**
  - returns `null` headers when there is no `ADMIN_PROXY_SECRET`;
  - posts the body to `/functions/v1/<name>`.
- **Check:** `pnpm test`. Biome lints the function.

### 3. `feat(registration): QR pass after registering and at /pase`

- `pnpm add qrcode-generator` (approved dependency).
- **`features/registration/pass.ts`:**
  - `qrSvg(token)`: payload `NEOTEAM-SR26:<token>`, error correction `M`, scalable SVG;
  - `claimPass(input)`: calls `registration-pass`.
- **`features/registration/pass.test.ts`:** the SVG contains `<svg` and is the same for the same token.
- **`features/registration/actions.ts`:** on success, call `claimPass` with the code, document and email, and return `qr` (SVG) and `name`. If the call fails, return no `qr` and log the error.
- **`features/registration/pass-card.tsx`** (server-safe): the QR at 240 px or more on white, the code, the name, and the screenshot hint. Tailwind on tokens; `aria-label` "Código QR de check-in SR26-xxxxx".
- **`features/registration/registration-form.tsx`:** the success state renders `PassCard`, or the code plus the "/pase" fallback line.
- **`features/registration/claim-actions.ts` and `claim-form.tsx`:** the `/pase` form.
  - Zod schema: document 5–30 characters, email.
  - Generic error "No encontramos una inscripción con ese documento y correo.".
- **`app/pase/page.tsx`:**
  - layout of `/registro` with `BrandLink` and "Volver al evento";
  - copy from Santiago ("UN QR. Y A CORRER.");
  - `metadata` with title "Tu pase · Social Run NeoTeam" and `robots: { index: false }`.
- **Links to `/pase`:**
  - `components/site-header.tsx`: "Mi pase" in the nav;
  - `app/registro/page.tsx`: "¿Ya te inscribiste? Recupera tu pase";
  - `features/home/sections/hero.tsx`: a text link next to "Quiero participar".
- **`CHANGELOG.md`, Added:**
  - "Pase con código QR al inscribirte y página **Mi pase** para recuperarlo con tu documento y correo.".
- **Checks, at 390×844 first, then 1440:**
  - the success card with the QR, with `claimPass` mocked;
  - `/pase` empty, with an error, and with a result;
  - the QR scans with a phone camera and reads `NEOTEAM-SR26:<uuid>`;
  - the header at 390 px does not wrap;
  - `pnpm build` shows no growth in the `/registro` client JS (compare the `.next` build output before and after).

### 3b. `refactor(registration): Tailwind forms with explicit labels` (asked by Iván on 2026-10-05)

- `/registro` and `/pase` share `features/registration/registration-shell.tsx` (header, title, facts) and `form-ui.tsx` (`TextField`, `SelectField`, `CheckboxField`, `FormSection`, `FormMessage`, `SubmitButton`).
- Every input has an `id` and a `<label htmlFor>`; errors are tied with `aria-invalid` and `aria-describedby`; the server message has `role="alert"`.
- No `<br>` in titles: each line is a `span` that becomes `block` from `md:`.
- The legacy registration rules in `app/globals.css` are deleted.
- **Checks:** 390 then 1440 screenshots of empty, error and success states for both pages; `pnpm ci:check`.

### 4. `feat(admin): check-in section with QR scanner`

- Shared Edge code goes to `supabase/functions/_shared/` (asked by Iván): `proxy.ts` (proxy-secret check, used by `admin-pin` and `registration-pass`) and `participants.ts` (code parsing, lookup, payload and the atomic `checkInParticipant`). `admin-logos` keeps its own copy until the edge-function split plan.

- `pnpm add html5-qrcode` (approved dependency).
- **`supabase/functions/admin-pin/index.ts`:** the `checkin` action (session required).
  - It parses the code with the existing `normalizeParticipantCode`.
  - It runs the atomic conditional `update … where status = 'registered' returning`. If no row is updated, it re-reads the row and returns `alreadyCheckedIn`, `cancelled` or a 404.
- **`features/admin/ui/qr-scanner.tsx`:**
  - `import('html5-qrcode')` on mount, back camera, QR only;
  - `onScan(text)`, ignoring the same text for 5 s;
  - stops on unmount;
  - when camera permission is denied, shows "Permite el acceso a la cámara o escribe el código.".
- **`features/admin/checkin/checkin-view.tsx`:** the scanner, the result card (four states from the spec), the manual code field and `navigator.vibrate?.(80)`.
- **`features/event/datetime.ts` and its test:** `formatTime(iso)` in `America/Bogota`. Test: `'2026-10-18T12:41:00Z'` gives `7:41 a. m.`.
- **`features/admin/sections.ts`:** `checkin` first, with label "Check-in", `UserCheck`, description "Escanea el QR o escribe el código de cada corredor." and quick access "Escáner QR".
- **`features/admin/admin-app.tsx`:** render `CheckinView`.
- **`features/admin/types.ts`:** a `CheckinResult` type.
- **`DESIGN.md`:** `UserCheck` already means check-in, so nothing to add there; add the "Check-in" section to the admin sections icon row.
- **`CHANGELOG.md`, Added:** "Check-in con escáner QR en el panel, pensado para el celular del staff.".
- **Checks:**
  - **390×844 first** (Playwright with a mocked `/api/admin` for the four result states and the denied-camera state), then 1440;
  - a real QR from Task 3 scanned with a real iPhone and a real Android against a Vercel preview, after Iván deploys `admin-pin`;
  - scanning the same QR from two phones gives one check-in and one "Ya hizo check-in";
  - the bundle size added by `html5-qrcode` is noted in the PR;
  - `pnpm ci:check`.

### 5. Deploy and clean up (Iván)

- `supabase functions delete registration-pass admin-checkin apple-wallet-pass` (an error for one that does not exist is fine; spec 4 recreates the Wallet function).
- `supabase functions deploy admin-pin registration-pass`
- Close Santiago's `feat/qr-wallet-checkin` PR with a link to this one; spec 4 continues the Wallet part.

## Done when

- `pnpm ci:check` passes.
- The real-phone checks are done on a preview.
- The branch stays local until Iván says to push it.
