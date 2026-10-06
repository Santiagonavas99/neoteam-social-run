# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Draws are atomic**: raffle draws, dynamic draws and instant-win scans run in one database transaction. A double click or two staff members acting at once can no longer overwrite winners or award more prizes than configured, and a failed draw keeps the previous winners.
- Drawing an unknown raffle or dynamic returns "not found" instead of a server error.

### Added

- **CI on pull requests**: `pnpm ci:check` (lint, typecheck, tests, build) and the SQL tests run on every ready pull request into `main`.
- **`DESIGN.md`** with tokens, mobile-first standing rules and the measured design debt, plus `design/` for studies and baseline screenshots.
- Tests for the registration form rules and the admin proxy body parsing (including oversized gzip bodies).

### Changed

- The participant roster uses denser rows, clearer grouped metadata and an aligned state control on desktop and mobile without horizontal scrolling.

### Fixed

- Every admin button declares its type, so actions never submit a form by accident.
- The home carousels no longer re-subscribe their observers on every render.
- Carousel and admin markup use correct semantics for assistive technologies.

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
