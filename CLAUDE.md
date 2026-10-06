# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Mandatory workflow (see AGENTS.md):** read `DESIGN.md`, `design/` and the `frontend-design` skill → write spec → write plan → wait for Iván's explicit OK → implement. **Mobile first** (390 px) in every spec, plan and check. Never implement in the same turn the plan is written.

## Project

Event site for the NeoTeam Social Run (anniversary run, 18 Oct 2026): public landing (`/`), registration (`/registro`) and a PIN-protected admin panel (`/admin`). Next.js 16 App Router + React 19 + Supabase, deployed on Vercel. User-facing copy is Spanish; code stays English.

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
```

`next-env.d.ts` and `.next/` are generated (gitignored); `typecheck` runs `next typegen` first so it works on a clean clone. If `build` panics inside Turbopack, delete `.next/` and retry.

## Architecture

**The browser never talks to Supabase tables directly.** RLS is on for every table; access goes through three narrow paths:

1. **Registration** — `app/registro/actions.ts` is a server action that validates with Zod, then calls the Postgres RPC `register_social_run_participant` (the only public write path; returns the `SR26-xxxxx` code). Duplicate detection relies on the RPC's Spanish error message `"Ya existe una inscripción"`.
2. **Admin** — `app/admin/*` (client components) → `POST /api/admin` (Next route, Node runtime) → Supabase Edge Function `supabase/functions/admin-pin`. All admin operations are a single JSON body dispatched on an `action` field (`status`, `setup`, `login`, `validate`, `logout`, `changePin`, `listCards`, `saveCards`, `uploadAdminImage`, `dynamicData`, …). The edge function uses the service-role key; the Next proxy only ever forwards the publishable key.
3. **Logo carousel admin** — same pattern: `app/admin/logo-carousel-admin.tsx` → `POST /api/admin/logos` → `supabase/functions/admin-logos`.

Proxy details worth preserving when editing `app/api/admin/route.ts`:
- Large requests (image uploads) are gzip-compressed client-side (`CompressionStream` in `admin-dashboard.tsx`) and gunzipped in the route to stay under Vercel's body limit; the edge function still receives plain JSON.
- `x-forwarded-for` is forwarded only when `VERCEL === "1"` (used for PIN rate limiting upstream).
- Upstream 5xx/errors are replaced with a generic Spanish message; never leak upstream details.

**Admin auth**: first access uses `ADMIN_SETUP_SECRET` (Supabase Edge Function secret only, never a Vercel/`NEXT_PUBLIC_*` var) to set a 6-digit PIN stored hashed in Supabase. Login returns a session token kept in `localStorage`; the edge function stores only its SHA-256 hash in `admin_pin_sessions`. Changing the PIN revokes other sessions.

**Home page** (`app/page.tsx`, `force-dynamic`) reads feature cards, logo carousel items and community data via `lib/home-features.ts` using the server Supabase client; each loader falls back to hardcoded defaults on error so the landing never breaks. Static event copy/agenda lives in `lib/event.ts`.

**Styling**: plain global CSS layered in `app/layout.tsx` — `globals.css` → `neo-overrides.css` → `logo-marquee.css` → `home-v2.css` (later files override earlier ones). No Tailwind/CSS modules.

## Supabase

- Remote project `ohatsnkgaeccltqwhkbv` is the source of truth for the schema. Do **not** run an initial schema against it. `supabase/migrations/` only holds incremental changes added in this repo, not the full schema (a `supabase db pull` is still pending).
- Edge functions are Deno with `// @ts-nocheck` and excluded from `tsconfig.json`; Biome still lints them.
- Env vars: see `.env.example`. Server routes prefer `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` and fall back to the `NEXT_PUBLIC_*` versions; `lib/supabase/config.ts` hardcodes the public project URL/publishable key as a final fallback.

`docs/admin-preview-handoff.md` records the state of the admin Preview deployment investigation (unverified items, resume steps).
