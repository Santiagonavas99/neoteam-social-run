# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Mandatory workflow (see AGENTS.md):** read `DESIGN.md`, `design/` and the `frontend-design` skill → write spec → write plan → wait for Iván's explicit OK → implement. **Mobile first** (390 px) in every spec, plan and check. Never implement in the same turn the plan is written.

## Project

Event site for the NeoTeam Social Run (anniversary run, 18 Oct 2026): public landing (`/`), registration (`/registro`) and a staff admin panel (`/admin`, sign-in by emailed code). Next.js 16 App Router + React 19 + Supabase, deployed on Vercel. User-facing copy is Spanish; code stays English.

## Commands

```bash
pnpm install
pnpm dev                      # local dev server
pnpm lint / pnpm lint:fix     # Biome
pnpm typecheck                # next typegen && tsc --noEmit
pnpm test                     # node --test on **/*.test.ts (strip-types, no framework)
node --experimental-strip-types --test path/to/file.test.ts   # single test file
pnpm build
pnpm ci:check                 # lint + typecheck + test + build
pnpm test:db                  # SQL tests in the compose `db` service (supabase/postgres, :54322)
```

`next-env.d.ts` and `.next/` are generated (gitignored); `typecheck` runs `next typegen` first so it works on a clean clone. If `build` panics inside Turbopack, delete `.next/` and retry.

## Architecture

**Layout (DDD-lite, by bounded context):** `app/` holds routes only (pages, layouts, `route.ts`, CSS). Domain code lives in `features/<context>/`: `event` (shared kernel: date, agenda, countdown), `registration`, `home`, `admin` (one folder per admin screen plus `ui/` building blocks, `api.ts` client, `sections.ts` navigation config, `types.ts` entities). `components/` is UI shared across features; `lib/` is infrastructure (Supabase clients, admin proxy). Features import from `components/`, `lib/` and `features/event/`, never from each other or from `app/`. Pure logic sits in its own `.ts` file with a `.test.ts` next to it.

**The browser never talks to Supabase tables directly.** RLS is on for every table; access goes through three narrow paths:

1. **Registration** — `features/registration/actions.ts` is a server action that validates with Zod, then calls the Postgres RPC `register_social_run_participant` (the only public write path; returns the `SR26-xxxxx` code). Duplicate detection relies on the RPC's Spanish error message `"Ya existe una inscripción"`. Right after it, `registeredPass` asks the `registration-pass` edge function (`registered` action) for the pass, which emails it once (`_shared/pass-email.ts`, inline GIF QR) only within 15 minutes of registering. `/pase` needs an emailed 6-digit code (`requestCode`, then `claim` with `otp`; table `pass_email_codes`).
2. **Admin** — `features/admin/*` (client components, mounted by `app/admin/page.tsx`) → `POST /api/admin` (Next route, Node runtime) → Supabase Edge Function `supabase/functions/admin-pin`. All admin operations are a single JSON body dispatched on an `action` field (`requestCode`, `verifyCode`, `validate`, `logout`, `users`, `checkin`, `listCards`, `saveCards`, `uploadAdminImage`, `dynamicData`, …). The edge function uses the service-role key; the Next proxy only ever forwards the publishable key.
3. **Logo carousel admin** — same pattern: `features/admin/logos/` → `POST /api/admin/logos` → `supabase/functions/admin-logos`.

Both API routes are thin wrappers around `proxyToEdgeFunction` in `lib/admin-proxy.ts`. Details worth preserving when editing it:
- Large requests (image uploads) are gzip-compressed client-side (`CompressionStream` in `features/admin/api.ts`) and gunzipped in the route to stay under Vercel's body limit; the edge function still receives plain JSON.
- `x-forwarded-for` is forwarded only when `VERCEL === "1"` (used for sign-in rate limiting upstream).
- Upstream 5xx/errors are replaced with a generic Spanish message; never leak upstream details.

**Admin auth**: one account per staff member in `admin_users` (name, email, role `admin` or `checkin`); no passwords or PINs. `requestCode` emails a random 6-digit code through Resend (`_shared/email.ts`, secrets `RESEND_API_KEY` / `EMAIL_FROM`, see `docs/email-setup.md`), stored as a SHA-256 hash in `admin_login_codes` (10 min, single use, 5 tries, 3 codes per 15 min); `verifyCode` creates a 30-day session. The Next route (`lib/admin-proxy.ts`) moves the session token into the httpOnly cookie `neoteam_admin_session` (Path `/api/admin`) and copies it back into each forwarded body, so the browser never sees it; `admin_pin_sessions` stores only its SHA-256 hash. `_shared/session.ts` rejects sessions of inactive users, and one guard at the top of `admin-pin` enforces the role: `checkin` users may only call `checkin`; everything else (and all of `admin-logos`) needs `admin`. The client's role (`sectionsFor`) only picks which sections to show. Admins manage staff in the Equipo screen (`users` action); the first admin is inserted by SQL.

**Home page** (`app/page.tsx`, `force-dynamic`) renders one component per section (`features/home/sections/`) and reads logo carousel items and community data via `features/home/data.ts` using the server Supabase client; each loader falls back to hardcoded defaults on error so the landing never breaks. Static event copy, agenda, start/end times and the meeting point live in `features/event/event.ts`; `features/event/calendar.ts` builds the Google Calendar link and the `.ics` served at `/evento.ics`, and `features/event/platform.ts` (`isApplePlatform`, from the `user-agent` header) picks the calendar link and hides Google Wallet on Apple devices and Safari.

**Styling**: plain global CSS layered in `app/layout.tsx` — `globals.css` → `home-v2.css` (later files override earlier ones), plus Tailwind 4 utilities (`app/tailwind.css`, no preflight; legacy unlayered CSS wins conflicts). The admin is Tailwind only; new UI uses Tailwind on the `--neo-*` tokens; see `DESIGN.md`.

## Supabase

- Remote project `ohatsnkgaeccltqwhkbv` is the source of truth for the schema. Do **not** run an initial schema against it. `supabase/migrations/` only holds incremental changes added in this repo, not the full schema (a `supabase db pull` is still pending).
- Edge functions are Deno with `// @ts-nocheck` and excluded from `tsconfig.json`; Biome still lints them.
- Env vars: see `.env.example`. Server routes prefer `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` and fall back to the `NEXT_PUBLIC_*` versions; `lib/supabase/config.ts` hardcodes the public project URL/publishable key as a final fallback.

`docs/admin-preview-handoff.md` records the state of the admin Preview deployment investigation (unverified items, resume steps).
