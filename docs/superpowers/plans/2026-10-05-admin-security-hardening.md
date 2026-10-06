# Admin security hardening — plan

Spec: `docs/superpowers/specs/2026-10-05-admin-security-hardening-design.md`. Branch: `fix/admin-security-hardening`, cut from `main` after `chore/professionalize-tooling` merges (or rebased onto it). Status: **awaiting OK**.

One commit per task. Steps marked **(Iván)** touch secrets or production and are done by Iván. No agent handles secret values.

---

## Task 1 — Read the remote schema

- [ ] **(Iván)** `supabase link --project-ref ohatsnkgaeccltqwhkbv`, then `supabase db pull` (or `supabase gen types typescript --linked > supabase/types.ts` if a pull is not wanted yet).
- [ ] Record the id types and the relevant columns of `raffles`, `raffle_entries`, `dynamics`, `dynamic_participations` and `registrations` in this plan, under Task 3.
- [ ] Read `admin-pin/index.ts:626-693` (dynamics draw) and write its exact rules below Task 3: eligibility, winner count, replace vs append, final status.
- Commit: `chore(supabase): pull remote schema` (if pulled).

## Task 2 — Attempt reservation SQL

- [ ] `supabase/migrations/20261006090000_admin_pin_atomic_attempts.sql`: `admin_pin_reserve_attempt(p_ip text) returns bigint` and `admin_pin_mark_success(p_attempt_id bigint) returns void`, as in spec §2 (advisory xact lock, 8 per IP per 10 min, 50 global per 60 min, `security definer`, `set search_path = ''`, revoke from `public, anon, authenticated`, grant to `service_role`).
- [ ] `supabase/tests/admin_pin_attempts.sql` (plain SQL script with `do $$ … assert … $$`): the 9th failure from one IP returns null; the 51st global failure returns null; mark_success excludes the row from the counts.
- Check: **(Iván)** run migration + script on the remote inside `begin; … rollback;` (nothing persists). No local Docker or Postgres.
- Commit: `fix(db): atomic admin PIN attempt reservation`

## Task 3 — Atomic draws SQL

- [ ] `supabase/migrations/20261006091000_atomic_draws.sql`: `draw_raffle`, `draw_dynamic`, `record_dynamic_participation`, as in spec §4, using the types from Task 1. Same grants as Task 2.
- [ ] `supabase/tests/atomic_draws.sql`: drawing a non-open raffle raises; drawing twice gives one set of winners; the instant win never exceeds `winner_count` (loop with `p_roll = 0`).
- Check: as in Task 2 (remote, `begin; … rollback;`).
- Commit: `fix(db): transactional raffle and dynamic draws`

## Task 4 — Proxy sends the secret and client IP

- [ ] `app/api/admin/route.ts`, `app/api/admin/logos/route.ts`: read `process.env.ADMIN_PROXY_SECRET` (server-only). If it is missing, return 503 and log `{ hasProxySecret: false }`. Send `x-admin-proxy-secret`, and `x-admin-client-ip` (only when `VERCEL === '1'`, first `x-forwarded-for` entry). Stop forwarding `x-forwarded-for`.
- [ ] Logos route: sanitize upstream ≥ 500 like `/api/admin` (L4).
- [ ] `.env.example`: `ADMIN_PROXY_SECRET=` with the comment "server only; same value as the Supabase Edge Function secret".
- [ ] If the tooling plan's `lib/admin-proxy.ts` exists, put the header logic there and extend `lib/admin-proxy.test.ts` (secret header always sent; client IP only on Vercel). Otherwise duplicate in both routes and leave a `ponytail:` note pointing to the tooling plan.
- Check: `pnpm ci:check`.
- Commit: `fix(api): authenticate admin proxy to edge functions`

## Task 5 — Edge functions enforce it

- [ ] `admin-pin` and `admin-logos`: on every request, before parsing the body, constant-time compare `x-admin-proxy-secret` with `Deno.env.get('ADMIN_PROXY_SECRET')` (compare SHA-256 digests byte by byte). Mismatch or unset → 401 `{ error: 'No autorizado.' }`. Remove the CORS headers and the `OPTIONS` branch.
- [ ] `getClientIp` reads only `x-admin-client-ip`, falling back to `'unknown'`.
- [ ] `setup`, `login` and `changePin` use `rpc('admin_pin_reserve_attempt')`: `null` → 429 (current message); an RPC error → 503 "No pudimos verificar el acceso. Inténtalo de nuevo."; success → `rpc('admin_pin_mark_success')`. Delete `checkRateLimit` and `recordAttempt`.
- [ ] Raffle draw, dynamics draw and instant win call the Task 3 RPCs; map the "not open" exception to the current 409 messages.
- [ ] `configs[resource]` → `Object.hasOwn(configs, resource)` guard (L1).
- Check: `pnpm lint`; the diff touches only these two files; every response message matches the current wording.
- Commit: `fix(edge): proxy-only access, atomic PIN attempts and draws`

## Task 6 — Rollout and verification

- [ ] **(Iván)** Generate the secret with `openssl rand -hex 32`. Set it in Vercel (`ADMIN_PROXY_SECRET`, Production + Preview + Development, not `NEXT_PUBLIC_`) and in Supabase → Edge Functions → Secrets.
- [ ] **(Iván)** Push the branch, which deploys the preview proxy.
- [ ] **(Iván)** `supabase db push` (both migrations), then `supabase functions deploy admin-pin admin-logos`.
- [ ] Verify on the preview:
  - login, the dashboard, logo upload, check-in, a test raffle draw (create → draw → draw again → same winners kept / 409), and logout;
  - a direct `curl` to `…/functions/v1/admin-pin` with only the publishable key → 401;
  - 9 wrong PINs → the 9th returns 429;
  - 10 parallel wrong PINs → at most 8 are evaluated (count the rows in `admin_pin_attempts`).
- [ ] Delete the test raffle and its entries.
- [ ] Mark H1, H2, M1, M3, M4, L1, L3 and L4 as fixed in the audit, with the commit hashes.
- Commit: `docs(audit): mark admin security findings fixed`

## Notes for Task 3 (filled in Task 1)

_Types and dynamics-draw rules go here._
