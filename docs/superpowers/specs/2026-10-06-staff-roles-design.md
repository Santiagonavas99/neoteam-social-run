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
