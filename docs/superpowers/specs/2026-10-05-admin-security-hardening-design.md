# Admin security hardening — spec

Date: 2026-10-05 · Branch: `fix/admin-security-hardening` (from `main`) · Status: **awaiting OK** · Priority: **before 18 Oct 2026**

Source: `docs/superpowers/audits/2026-10-05-code-review.md` (H1, H2, M1, M3, M4, L1, L4).

## Problem

1. **The PIN can be brute-forced (H1, H2, M1).** `admin-pin` rate-limits by the first `x-forwarded-for` entry, but the function is publicly reachable with the publishable key, so a caller picks its own IP for each request. The check-then-record sequence (`checkRateLimit` → PBKDF2 → `recordAttempt`) is not atomic, so parallel requests all pass. A database error while counting counts as 0. Together: unlimited guesses at a 6-digit PIN (10^6 combinations). The same pattern guards `setup` and `changePin`.
2. **Draws are not atomic (M3, M4).** The raffle and dynamics draws check `status = 'open'`, delete previous winners, insert new ones and mark the draw done in separate requests. A double-click, or two staff members acting at once, overwrites the winners; a failed insert after the delete loses them. The instant win counts winners and inserts in separate steps, so it can award more than `winner_count`. These run live at the event.
3. Small items found on the way: `configs[resource]` accepts `__proto__` (L1); the logos proxy forwards upstream 5xx bodies (L4).

## Design review

No UI change. Error messages stay in the panel's existing Spanish voice ("Demasiados intentos…"). One new state: when the global cap trips, the login shows the same 429 message.

## Decisions

1. **Only the Next proxy may call the admin functions.** A new secret `ADMIN_PROXY_SECRET` (32 random bytes, hex) lives in Vercel (server-only, all environments) and in Supabase Edge Function secrets. Both proxy routes send it as `x-admin-proxy-secret`, together with the client IP in `x-admin-client-ip` (from Vercel's `x-forwarded-for`, which Vercel sets and the client cannot spoof at the edge). The functions compare the secret in constant time and reject anything else with 401. They read the IP only from `x-admin-client-ip`; `x-forwarded-for` and `cf-connecting-ip` are ignored.
   - Rejected: HMAC-signing only the IP. It adds the same secret plus a signature scheme, and still leaves the functions directly callable.
   - CORS headers are removed (L3); browsers never call the functions directly.
2. **Atomic attempt reservation in Postgres.** `public.admin_pin_reserve_attempt(p_ip text) returns bigint`:
   - takes `pg_advisory_xact_lock(hashtext('admin_pin_attempts'))`;
   - refuses (returns `null`) when the IP has ≥ 8 failures in 10 min **or** all IPs together have ≥ 50 failures in 60 min (global cap);
   - otherwise inserts a row with `success = false` and returns its id.

   `public.admin_pin_mark_success(p_attempt_id bigint)` sets `success = true`. Every attempt counts as a failure until proven correct, so parallel requests serialize on the lock and see each other. Both functions use `security definer`, `set search_path = ''`, and `execute` revoked from `public, anon, authenticated` and granted to `service_role`.
   - Trade-off: an attacker with many real IPs can trip the global cap and lock the admin out for up to an hour. That is accepted, because a lockout is recoverable and a guessed PIN is not. The panel shows the usual 429 message.
3. **Fail closed.** Any error from the reservation RPC returns 503 "No pudimos verificar el acceso…". It never allows the attempt.
4. **Draws become single transactions.**
   - `public.draw_raffle(p_raffle_id, p_event_id) returns integer`: `select … for update` on the raffle scoped by event, raise if not `open`, choose winners from the eligible registrations `order by gen_random_uuid()` (backed by `pg_strong_random`) `limit winner_count`, replace `raffle_entries`, set `status = 'drawn'`, and return the winner count. All of it commits or rolls back together.
   - `public.draw_dynamic(p_dynamic_id, p_event_id)`: the same pattern, mirroring the current dynamics draw (`admin-pin/index.ts:626-693`).
   - `public.record_dynamic_participation(p_dynamic_id, p_registration_id, p_roll double precision, …) returns text`: locks the dynamic row (`for update`), counts winners, and decides `winner`/`completed` from `p_roll < probability and count < winner_count`. The edge function keeps generating `p_roll` with `crypto.getRandomValues`. The current unique-violation path is preserved.
   - All of them use `security definer`, `search_path = ''`, `service_role` only. The edge function calls them through `supabase.rpc`.
5. **L1:** `Object.hasOwn(configs, resource)`. **L4:** the logos proxy sanitizes upstream ≥ 500 exactly like `/api/admin`.

## Mobile

Staff run login, check-in, instant-win scans and draws from phones on event day. The new 429/503/401 states use the existing feedback component, which is checked at 390 px. Phones on mobile data change IP often (CGNAT, cell handover): the per-IP limit (8 per 10 min) stays as it is, so a legitimate user who switches network is not punished for someone else's failures; the global cap is the backstop.

## Rollout (zero downtime)

1. Iván sets `ADMIN_PROXY_SECRET` in Vercel and in Supabase secrets.
2. Deploy the Next proxy (it sends the new headers; the current functions ignore them).
3. Apply the migration (it only adds functions; nothing uses them yet).
4. Deploy `admin-pin` and `admin-logos` (they now enforce the secret and use the RPCs).
5. Verify on the Vercel preview, then on production.

Rollback: redeploy the previous function versions. The new SQL functions are inert without them.

## Out of scope

Registration abuse/captcha (M2), CSP (L5), retention cron (L6), SQLSTATE for duplicates (L7), the remaining correctness and duplication items. They stay in the audit backlog.

## Risks and unknowns

- **There is only one Supabase project (production) and no local Postgres/Docker in use** (Iván's local DB is MySQL). The SQL is verified on the remote inside `begin; … rollback;`, then applied (it is additive) and exercised on a test raffle and dynamic that are deleted afterwards.
- **The column types of `raffles`, `raffle_entries`, `dynamics`, `dynamic_participations` and `registrations` exist only in the remote schema.** The plan's first task reads them (`supabase db pull` or `gen types`) before writing the SQL.
- **Exactly what the dynamics draw does today is read from the code** (`admin-pin/index.ts:626-693`) and mirrored 1:1. Any difference found is raised to Iván before proceeding.
