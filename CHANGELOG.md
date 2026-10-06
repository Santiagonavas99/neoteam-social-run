# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-10-05

### Added

- **Add your pass to Google Wallet** from the registration confirmation and Mi pase (Android).

## [0.6.0] - 2026-10-05

### Added

- **Delete all draft dynamics** in one step from the Dinámicas panel.

## [0.5.1] - 2026-10-05

### Changed

- **New cyan accent color** across the site and the admin panel, with a darker cyan for text so it stays readable.

## [0.5.0] - 2026-10-05

### Added

- **Dynamics panel** in the admin: stands, checkpoints, challenges, instant wins and raffles. Staff register each runner by scanning their QR, and a raffle draw shows the winners' names to read aloud.

### Changed

- **Raffles now live inside Dynamics**; the separate Rifas section is gone.

## [0.4.0] - 2026-10-05

### Added

- **QR pass after registering**, and a **Mi pase** page (`/pase`) to get it back with your document number and email.
- **Check-in with a QR scanner** in the admin panel, built for staff phones. If two phones scan the same QR, it counts once.

### Changed

- **Registration and pass forms**: every field has its own label, and screen readers announce each error with its field.

### Fixed

- **Readable text on the home page**: buttons and links at 14–15 px, the agenda at 15 px and no label under 12 px.
- **Registration form keeps your answers** when the server reports an error, including the document type and running group. Before, every field came back empty.
- **Phone numbers must have 10 digits.** Numbers autofilled as `+57 300 123 4567` are corrected automatically.

## [0.3.0] - 2026-10-05

### Added

- **NeoTeam logo** in the home header, the registration page and the admin panel. It adapts its colors to light and dark backgrounds, so it can be read everywhere.
- **Favicon**: the "NT" mark on a black square, visible on light and dark browser tabs.

## [0.2.1] - 2026-10-05

### Changed

- **Code organized by domain**: event, registration, home and admin each live in their own folder, and the admin is split into one screen per section on shared building blocks. Nothing changes on screen.
- Admin login makes one request fewer: it no longer loads the home cards nobody could edit.
- A connection error in the logo carousel admin now shows a Spanish message instead of "Failed to fetch".

### Removed

- The home cards editor, which was no longer reachable from the admin menu.

### Fixed

- The logos proxy answers with a generic error (502) when the Edge Function returns something that is not JSON, the same as the admin proxy.

## [0.2.0] - 2026-10-05

### Added

- **Countdown to the event** on the home hero: days, hours, minutes and seconds to the 18 Oct meeting at 7:30, "En curso" during the event, hidden afterwards.
- **Icon system** (`lucide-react`) on every screen: actions, admin sections, metrics, empty states, and status badges and messages that no longer rely on color alone.
- **Tailwind CSS 4** next to the existing styles, reading the same design tokens, plus the dark palette that the coming theme switch will use.
- **CI on pull requests**: `pnpm ci:check` (lint, typecheck, tests, build) and the SQL tests run on every ready pull request into `main`.
- **`DESIGN.md`** with tokens, mobile-first standing rules, the icon vocabulary and the measured design debt, plus `design/` for studies and baseline screenshots.
- Tests for the registration form rules, the admin proxy body parsing (including oversized gzip bodies) and the countdown.

### Changed

- Arrows mean one thing: a straight arrow moves forward inside the site, the diagonal one only opens a new tab.

### Fixed

- **Draws are atomic**: raffle draws, dynamic draws and instant-win scans run in one database transaction. A double click or two staff members acting at once can no longer overwrite winners or award more prizes than configured, and a failed draw keeps the previous winners.
- Drawing an unknown raffle or dynamic returns "not found" instead of a server error.
- Every admin button declares its type, so actions never submit a form by accident.
- The home carousels no longer re-subscribe their observers on every render.
- Carousel and admin markup use correct semantics for assistive technologies.
- Opening another page starts at its top instead of smooth-scrolling from the previous position.

### Security

- Security headers on every response (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` with camera limited to the site, `X-Frame-Options: DENY`).

## [0.1.0] - 2026-10-05

### Added

- **Landing page** (`/`) for the Social Run · NeoTeam anniversary (18 Oct 2026), with the event configuration, agenda and route in `lib/event.ts`.
- **Editorial home v2**: redesigned layout with hero meta pills, a sticky agenda and horizontal carousels for communities and partners.
- **Logo marquee**: an infinite, reduced-motion-aware strip of partner logos, backed by its own Supabase table and managed from the admin panel.
- **Registration** (`/registro`): a Zod-validated form submitted through a server action to the `register_social_run_participant` RPC, which returns a `SR26-xxxxx` code. The browser never touches the `registrations` table.
- **Admin panel** (`/admin`) with 6-digit PIN access:
  - first-time setup protected by `ADMIN_SETUP_SECRET`;
  - PIN rotation that revokes previous sessions;
  - sections for metrics, participants (check-in, status, permanent deletion), running groups, brands, raffles and home content;
  - image uploads to the admin media bucket.
- **Admin proxy routes** (`/api/admin`, `/api/admin/logos`) in front of the `admin-pin` and `admin-logos` Edge Functions. Large uploads travel gzip-compressed to stay under Vercel's request limit.
- **Agent rules** (`AGENTS.md`, `CLAUDE.md`) with a mandatory design → spec → plan → approval workflow and a mobile-first rule; specs, plans and audits live in `docs/superpowers/`.
- **Local SQL tests**: `docker-compose.yml` with `supabase/postgres` on port 54322, and `pnpm test:db`, which runs each `supabase/tests/*.sql` in a throwaway database.
- **Unit tests** with Node's built-in runner (`pnpm test`).
- `pnpm ci:check` runs lint, typecheck, tests and the production build.
- **Release workflow**: merging into `main` with a new `package.json` version that has a matching `CHANGELOG.md` section creates the `vX.Y.Z` tag and its GitHub release.

### Changed

- **Package manager**: npm → pnpm (`packageManager`), Node 22 pinned via `engines` and `.nvmrc`.
- **TypeScript** 5.9 → 7.0 in strict mode, with `noUncheckedIndexedAccess`, `verbatimModuleSyntax` and the `noUnused*` checks.
- **Biome** is now the linter and formatter for the whole repository (2 spaces, single quotes, no semicolons).
- `next-env.d.ts` is generated, not tracked; `pnpm typecheck` runs `next typegen` first.
- Host Grotesk is the global typeface; the palette is aligned with the NeoTeam logo.
- The home feature cards carousel was replaced by the logo marquee.

### Fixed

- The admin panel works on Vercel previews without public Supabase variables: requests go through a server proxy, and the public config has a fallback.
- The "Rifas" raffle label in the admin no longer breaks when it receives an unknown status.

### Security

- **Admin PIN brute force**:
  - The admin Edge Functions accept only requests from the Next proxy, which must carry the `ADMIN_PROXY_SECRET` shared secret. A direct call with the public key gets 401.
  - The client IP for rate limiting comes from the proxy and can no longer be forged by the caller.
  - PIN attempts are reserved atomically in Postgres (`admin_pin_reserve_attempt`): 8 failures per IP every 10 minutes and 50 failures overall per hour. Parallel requests can no longer get past the limit.
  - When the attempt store is unavailable, access is denied (503) instead of allowed.
- CORS removed from the admin Edge Functions; browsers only reach them through the proxy.
- The logos proxy no longer exposes upstream 5xx error bodies.
- Admin resource lookups reject prototype keys (`__proto__`, `constructor`).
