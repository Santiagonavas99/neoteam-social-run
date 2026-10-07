# Staff roles and pass email — plan

Specs:
- [`2026-10-06-staff-roles-design.md`](../specs/2026-10-06-staff-roles-design.md)
- [`2026-10-06-pass-email-design.md`](../specs/2026-10-06-pass-email-design.md)

Two PRs, staff roles first: it needs nothing external and is critical on event day, while email waits for the domain to be verified in Resend.
- **PR 1:** Part A on `feat/staff-roles`, released as `0.9.0` (task 7).
- **PR 2:** Part B on `feat/pass-email`, cut from `main` after PR 1 merges, released as `0.10.0` (task 12).

Status: **approved** (Iván, 2026-10-06). Email setup for Iván: [`docs/email-setup.md`](../../email-setup.md).

Remote steps (migrations, `supabase functions deploy`, `supabase secrets set`) are run by Iván, always with `--project-ref ohatsnkgaeccltqwhkbv`.

## Part A — staff roles

### 1. `feat(db): admin users and roles`

- **`supabase/migrations/<ts>_admin_users.sql`:**
  - `admin_users`, with a check on `role` and a unique `username`;
  - `admin_pin_sessions.user_id` (FK, cascade);
  - copies the current `admin_pin_settings.pin_hash` into user `admin` (role `admin`), only when it exists and the table is empty;
  - `delete from admin_pin_sessions where user_id is null`;
  - RLS on and `revoke all` from `anon` and `authenticated`.
  - Idempotent: `if not exists`, `on conflict do nothing`.
- **`supabase/tests/admin_users.sql`:** the constraints and the PIN copy (runs only if Iván starts the local db himself).
- **Check:** Iván runs it in a `begin … rollback` first and confirms one `admin` row, then for real.

### 2. `feat(admin): sign in per user with server-side roles`

- **`supabase/functions/admin-pin/index.ts`:**
  - `requireSession` joins `admin_users` (active) and returns `{ sessionId, userId, role, name }`;
  - `createSession(userId)`;
  - one guard at the top of the dispatcher:
    - `PUBLIC_ACTIONS`: `status`, `setup`, `login`, `validate`, `logout`;
    - `STAFF_ACTIONS`: `checkin`, `changePin`;
    - every other action needs `admin`;
    - the per-action `requireSession` calls are deleted.
  - `login`: `{ username, pin }`, with the same message for a wrong user or a wrong PIN.
  - `status`: `configured` means "an active admin exists".
  - `setup`: creates the first admin.
  - `validate` and `login` return `role` and `name`.
  - `changePin`: works on the user's own hash and revokes only that user's other sessions.
- **`supabase/functions/admin-logos/index.ts`:** same join, and requires `admin`.
- **`features/admin/auth/`:**
  - `auth-screen.tsx` gains the Usuario field (setup gains Nombre and Usuario);
  - `use-admin-session.ts` keeps `role` and `name` from `validate` and `login`;
  - a pure `isUsername()` in `auth/username.ts`, with a test.
- **`features/admin/sections.ts`:** each section gets `roles`, and a `sectionsFor(role)` with a test.
- **`features/admin/admin-app.tsx` and `shell/`:** the navigation shows `sectionsFor(role)`; a `checkin` user starts on `checkin`.
- **Checks:**
  - `pnpm ci:check`;
  - after Iván deploys:
    - sign in as `admin` with the current PIN;
    - a direct `curl` to `/api/admin` with a check-in user's token on `adminData` returns 403.

### 3. `feat(admin): team screen`

- **`admin-pin`:** action `users` with `list`, `create`, `update` and `resetPin`.
  - Validation: name 2–80, username `isUsername`, role, PIN of 6 digits.
  - Self-demotion and self-deactivation are refused.
  - Role, active and PIN changes delete that user's sessions.
- **`features/admin/team/team-view.tsx`:** cards (name, `@username`, role badge, Activo/Inactivo with icon and text) plus a create and edit form that uses `PinField` and the existing `editor-form` / `record-card` / `confirm-panel` blocks.
- **`sections.ts`:** "Equipo", `Users`-style icon `UserCog` (added to the vocabulary in `DESIGN.md`), group Cuenta, admin only.
- **Checks:**
  - 390 px, then 1440;
  - light and dark;
  - create a check-in user, sign in as that user in another browser and see only the scanner;
  - deactivate them and their next scan gets "Sesión no válida".

### Revision — emailed code sign-in (Iván, 2026-10-06)

See the spec's revision. Tasks 1–3 shipped username + PIN; tasks 4–7 replace PIN sign-in with an emailed code and move the session to a cookie. The migration from task 1 is edited in place: it has not run on the remote.

### 4. `feat(email): Resend sender and code email` (moved from Part B)

- **`supabase/functions/_shared/email.ts`:**
  - `sendEmail({ to, subject, html, text, attachments })`, a `fetch` to Resend that returns `{ ok }` or `{ ok: false, status }` and never passes Resend's body on;
  - `codeEmail(code, purpose)`.
- **Check:** after Iván sets the secrets, a code email reaches his inbox and renders on a phone.

### 5. `feat(admin): sign in with a code sent by email`

- **Migration `20261006150000_admin_users.sql`** (edited in place):
  - `admin_users.email` (unique, with a lowercase check) instead of `username` and `pin_hash`;
  - new table `admin_login_codes` (`user_id`, `code_hash`, `expires_at`, `attempts`, `used_at`);
  - RLS on everywhere and no grants;
  - the PIN copy is removed.
  - `supabase/tests/admin_users.sql` is updated.
- **`admin-pin`:**
  - `requestCode` and `verifyCode`;
  - removed: `setup`, `login`, `changePin`;
  - `status` and `validate` stay;
  - the users actions take `email`, and the PIN fields are removed.
  - The random code and its hash go in `_shared/otp.ts` (pure).
- **`features/admin/auth/`:**
  - the screen has an email step, then a code step with "Reenviar código" after 60 seconds;
  - `email.ts` (pure: `normalizeEmail`, `isEmail`) and its test replace `username.ts`;
  - `PinField` becomes `CodeField`, with `autocomplete="one-time-code"`;
  - deleted: the setup form, `security/change-pin-form.tsx` and the Seguridad section.
- **Equipo:** a Correo field replaces Usuario and the PIN.
- **Checks:**
  - `pnpm ci:check` and `pnpm test:db`;
  - 390 px, then 1440, with mocked responses.

### 6. `refactor(admin): session in an httpOnly cookie`

- **`lib/admin-proxy.ts`:**
  - when the answer carries `token`, the route removes it from the JSON and sets `neoteam_admin_session` (`HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=2592000`);
  - on each request it writes the cookie's value into `body.token`, overwriting whatever the client sent;
  - `logout` clears the cookie.
  - Tests are added to `lib/admin-proxy.test.ts`.
- **`features/admin/**`:** delete the `token` props and the `localStorage` key. `useAdminSession` boots with `validate`, which reads the cookie.
- **Check:** in the browser the session survives a reload, `document.cookie` does not show it, and "Cerrar sesión" clears it.

### 7. `chore(release): 0.9.0`

- `package.json` goes to 0.9.0.
- The CHANGELOG section `[0.9.0] - <date>`:
  - Added: staff accounts and roles, signing in with an emailed code, the Equipo screen;
  - plus the home refresh entries that PR #26 merged without a release.
- Docs:
  - `CLAUDE.md`: per-user sign-in by emailed code, and the cookie session;
  - `docs/email-setup.md`: the panel needs email before it can be deployed.
- Iván merged the pushed branch, so no history rewrite: a new `chore(release): 0.9.0` commit goes last and updates the notes.

## Part B — pass by email

### 8. `feat(email): pass template and QR`

- **`supabase/functions/_shared/email.ts`** (`sendEmail` and `codeEmail` already exist from task 4): adds `passEmail(row)`, as inline-styled HTML (tables, 600 px) plus text.
- **`supabase/functions/_shared/qr.ts`:** `qrGifBase64(token)` with `qrcode-generator` from esm.sh, and the same `NEOTEAM-SR26:` prefix as `features/registration/qr.ts` (a comment links the two).
- **`supabase/migrations/<ts>_pass_email.sql`:** `pass_email_codes` (RLS on, no grants) and `registrations.pass_emailed_at`.
- **Check:** Iván follows `docs/email-setup.md` (domain, secrets, migration); a test send to his own address renders in Gmail on a phone and the QR scans with the admin scanner.

### 9. `feat(registration): email the pass after registering`

- **`registration-pass`:** action `sendPass { code }`. It sends only if `created_at` is under 15 minutes old and `pass_emailed_at` is null, then sets `pass_emailed_at`.
- **`features/registration/actions.ts`:** after the RPC, call `sendPass` without blocking the response on its failure. The success card adds "También te lo enviamos a tu correo."
- **Checks:**
  - register, and the email arrives;
  - calling `sendPass` again does not send a second email.

### 10. `feat(pass): one-time code to open the pass`

- **`registration-pass`:**
  - `requestCode { documentNumber, email }`: the same generic answer whether or not the data match; at most 3 codes per registration in 15 minutes;
  - `claim` now needs `code`: checks the hash, expiry and `attempts < 5`, sets `used_at`.
  - The 6-digit generator and the hashing go in a pure `_shared/otp.ts`.
- **`features/registration/otp.ts`** (pure: code shape), with a test.
- **`claim-actions.ts` and `claim-form.tsx`:** two steps (data → code), a six-box code field with `autocomplete="one-time-code"`, and "Reenviar código" after 60 seconds.
- **Checks:**
  - 390 px first;
  - a wrong code 5 times burns it;
  - an unknown document gets the same message as a known one.

### 11. `feat(admin): resend a pass`

- **`admin-pin`:** action `resendPass { participantId }` (admin only), which reuses `passEmail`.
- **`participants-view.tsx`:** "Reenviar pase" button (`Mail` icon, added to the vocabulary) with Enviando… / Enviado / error feedback.
- **Check:** resending from the admin delivers the email.

### 12. `chore(release): 0.10.0`

- `package.json` goes to 0.10.0.
- The CHANGELOG section `[0.10.0] - <date>`, Added: the pass by email, the code to open the pass, "Reenviar pase".
- `CLAUDE.md`: the email path and its Supabase secrets (`docs/email-setup.md`). `.env.example` is untouched.
