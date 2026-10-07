# Staff accounts with roles — spec

Date: 2026-10-06 · Branch: `feat/staff-roles` · Status: **approved** (Iván, 2026-10-06)

## Problem

Iván, 2026-10-06: an admin must be able to create other admin users, or users who can only do check-in ("acceder a la página para abrir cámara y checkin").

Today the panel has one shared PIN (`admin_pin_settings`, a single row):
- whoever has it sees everything: participants, draws, content, security;
- a session cannot be traced to a person, and one volunteer cannot be removed without changing the PIN for everyone.

The camera check-in screen already exists (`features/admin/checkin`, action `checkin`). What is missing is identity and roles.

## Decisions

1. **Accounts are a username plus a 6-digit PIN.**
   - Staff sign in from a phone at the start line, and the six-box `PinField` already exists.
   - Username (not PIN alone): a PIN hash is salted, so a PIN-only login would have to try every user's hash. A username also gives each session a name.
2. **Two roles:**
   - `admin`: the whole panel, as today, plus the new "Equipo" screen;
   - `checkin`: only the Check-in screen and "Seguridad", where they change their own PIN. On sign-in they land on the scanner.
3. **New table `admin_users`:**
   - columns: `id`, `name`, `username` (unique, lowercase `[a-z0-9._-]{3,32}`), `role` (`admin` | `checkin`), `pin_hash` (same PBKDF2 format as today), `active`, `created_at` and `updated_at`;
   - `admin_pin_sessions` gains `user_id` (FK, `on delete cascade`).
   - RLS on and every grant revoked, like the other `admin_pin_*` tables.
4. **Migrating the current PIN.** The migration:
   - copies the existing `admin_pin_settings.pin_hash` into a first `admin` user named `admin`, so Iván's PIN keeps working;
   - deletes the current sessions (they have no user), so everyone signs in again once.
   - `admin_pin_settings` stays untouched and unused; dropping it is a later cleanup.
5. **First-time setup** (empty database) keeps `ADMIN_SETUP_SECRET`. It now creates the first admin, with a name, username and PIN, instead of the shared PIN.
6. **The role is enforced on the server, in one place.**
   - **Where:** a single guard at the top of the `admin-pin` dispatcher.
   - **Public actions:** `status`, `setup`, `login`, `validate` and `logout` skip the guard.
   - **Check-in actions:** `checkin` and `changePin` need any active user.
   - **Everything else** needs `admin`.
   - **Inactive users:** `requireSession` joins `admin_users` and rejects them, so deactivating someone ends their session immediately.
   - **`admin-logos`:** requires `admin` too.
   - Hiding the navigation is only convenience; the guard is the security boundary.
7. **"Equipo" screen** (admin only, under Cuenta), as a new action `users`:
   - `list`;
   - `create`: name, username, role and a temporary PIN;
   - `update`: name, role, active;
   - `resetPin`.
   - Changing role, deactivating or resetting a PIN deletes that user's sessions.
   - An admin cannot demote or deactivate themselves, so at least one admin always remains.
8. **`changePin`** changes the signed-in user's PIN and revokes only that user's other sessions (today it revokes everyone's).
9. **Sign-in screen:** gains a "Usuario" field (`autocomplete="username"`, `autocapitalize="none"`) above the PIN.
   - `login` and `validate` return `{ role, name }`; the client keeps the role only to choose which sections to show.
   - The rate limit per IP (`admin_pin_reserve_attempt`) stays as it is.

## Alternatives rejected

- **Supabase Auth with email and password or magic link:** a second identity system, email delivery on event day, and a login slower than a PIN for volunteers.
- **One shared PIN per role:** still no way to remove a single person.
- **Per-section permission flags:** two roles cover the request; more granularity can come when someone asks for it.

## Mobile

- Designed at 390 px first:
  - the sign-in form is two fields and a 44 px button;
  - the check-in user's bottom bar has only "Check-in" and "Más"; "Más" holds Seguridad, the theme and "Cerrar sesión". Empty navigation groups are hidden.
- **"Equipo"** is a list of cards (name, `@username`, role badge, active state) with 44 px actions, and a create form that uses `PinField`.
- The username input uses `inputmode="text"`, `autocapitalize="none"` and `spellcheck={false}`.

## Security

- PINs are stored hashed with PBKDF2 (the existing `hashPin`); session tokens are stored as SHA-256 hashes, as today.
- Role checks run on the server for every action; the browser's copy of the role is never trusted.
- A deactivated user, or one whose PIN was reset, loses access on their next request.
- No new environment variable. `ADMIN_SETUP_SECRET` keeps its role and never leaves Supabase secrets.

## Out of scope

- Per-action audit log ("who checked in whom"). The `user_id` on sessions makes it possible later.
- Roles for dynamics stands (scanning runners in a dynamic). That needs an `admin` today.
- Dropping `admin_pin_settings`.

## Revision — sign in with an emailed code (Iván, 2026-10-06)

Iván: no fixed PINs and no PIN fallback. Each sign-in uses a random 6-digit code sent to the person's email, and the device stays signed in for a month with a cookie. This **replaces decisions 1, 4, 5, 8 and 9**; roles, the server-side guard and the Equipo screen stay.

1. **Accounts are an email address.**
   - `admin_users` keeps `id`, `name`, `role`, `active` and the timestamps;
   - it gets `email` (unique, stored lowercase) in place of `username` and `pin_hash`.
   - The migration `20261006150000_admin_users.sql` has not run on the remote, so it is edited in place rather than followed by a second one.
2. **Sign-in, two steps:**
   1. **Email.** Action `requestCode { email }`:
      - the answer is always "Si el correo tiene acceso, te enviamos un código", so the screen cannot tell who is staff;
      - for an active user, it stores a SHA-256 hash of a random 6-digit code in a new `admin_login_codes` table, then emails the code through Resend.
   2. **Code.** Action `verifyCode { email, code }`. It creates the session.
   - **Limits:**
     - a code lasts 10 minutes and works once;
     - 5 wrong tries burn it;
     - at most 3 codes per user in 15 minutes;
     - the existing per-IP attempt limiter wraps `verifyCode`.
3. **The session lives in a cookie,** set by the Next route, not in `localStorage`:
   - `neoteam_admin_session`, with `HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=30 days` (the same 30 days the session row already has);
   - the route takes the token out of the edge function's answer and sets it as the cookie;
   - on every request, the route copies the cookie into the body it forwards, so page scripts never see the token;
   - `logout` deletes the row and clears the cookie.
   - Because of this, `token` disappears from the admin components.
4. **First admin:** Iván inserts one row by SQL (name, email, role `admin`), with no secret to type.
   - Removed: the `setup` action, the setup screen, the `ADMIN_SETUP_SECRET` check, `changePin` and the Seguridad section, since none of them remain.
   - A check-in user sees only Check-in, plus "Más" for the theme and "Cerrar sesión".
5. **Equipo** creates a user from name, email and role, and edits name, role and active. Changing role or turning someone off deletes their sessions.
6. **The Resend sender moves into this PR,** because signing in now depends on it.
   - New files: `_shared/email.ts` with `sendEmail()`, plus a code email template that Part B reuses for `/pase`.
   - **Prerequisite for deploying:** `mail.socialrun.site` is Verified, and the three secrets are set (`docs/email-setup.md`).

**Mobile:**
- the email field uses `type="email"` and `autocomplete="email"`;
- the code field is the six-box field, with `inputmode="numeric"` and `autocomplete="one-time-code"`, so the phone offers the code from the email;
- "Reenviar código" is enabled after 60 seconds.

**Trade-offs Iván accepted:**
- nobody can sign in if Resend is down or the 100-a-day free quota is spent. A 30-day cookie keeps that rare: one email per person per month;
- staff need their email on their phone on event day.
