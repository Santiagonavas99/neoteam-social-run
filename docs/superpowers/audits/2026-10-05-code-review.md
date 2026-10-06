# Code review — 2026-10-05

Branch `chore/professionalize-tooling`. Read-only review. H1, H2 and M1 were re-verified by reading `supabase/functions/admin-pin/index.ts:136-180, 246-264`.

**Action:** H1, H2, M1, M3 and M4 need a dedicated spec (`admin-security-hardening`) before the event on 18 Oct. The rest is backlog.

## Security

| ID | Sev | Where | Finding | Fix |
|----|-----|-------|---------|-----|
| H1 | High | `admin-pin/index.ts:136-139` | Rate limit keys on the first `x-forwarded-for`. The function is directly callable with the public publishable key, so a rotating fake IP gives unlimited tries at a 6-digit PIN (10^6). If the gateway rewrites the header instead, all proxied users share one IP and an attacker can lock out the admin. | Proxy signs the client IP (HMAC, shared secret) and the function verifies it; plus a global failure cap (e.g. 50/h). |
| H2 | High | `admin-pin/index.ts:248-264` (also 221-228, 976-991) | `checkRateLimit` counts, slow PBKDF2 runs, *then* `recordAttempt` writes. 100 parallel guesses all see `count < 8`. | Atomic: insert pending attempt then count, in one RPC or advisory lock. |
| M1 | Med | `admin-pin/index.ts:171-181` | Count error ignored → `null` → treated as 0 → allowed. Insert errors ignored. Fails open. | Error → 429/503. |
| M2 | Med | `app/registro/actions.ts:40-73` | No abuse control on registration; the RPC is callable directly by anon. | Turnstile/hCaptcha + per-IP throttle in the RPC. |
| L1 | Low | `admin-pin/index.ts:801` | `configs[resource]` accepts `__proto__`/`constructor` → 500. | `Object.hasOwn`. |
| L2 | Low | `migrations/20261004190000_admin_media_bucket.sql:8-12` | Public SELECT policy lets anon list all object names in the bucket. | Drop the policy; public URLs keep working. |
| L3 | Low | `admin-pin:15-20`, `admin-logos:11-16` | CORS `*` though only the Next proxy calls them. | Remove or restrict. |
| L4 | Low | `app/api/admin/logos/route.ts:51-52` | Forwards upstream 5xx bodies, unlike `/api/admin`. | Shared proxy helper with sanitized 5xx. |
| L5 | Low | — | 30-day admin token in `localStorage`, no CSP. | CSP + shorter sliding expiry. |
| L6 | Low | — | `admin_pin_attempts` / expired sessions never purged. | Scheduled cleanup. |
| L7 | Low | `actions.ts:76` | Duplicate detection matches a Spanish message. | Custom SQLSTATE, match `error.code`. |

## Correctness

| ID | Sev | Where | Finding | Fix |
|----|-----|-------|---------|-----|
| M3 | Med | `admin-pin/index.ts:626-693`, `916-962` | Draws: check `open` → delete winners → insert, no transaction. Double-click or two admins overwrite each other; failed insert loses winners. | Postgres function, one transaction, `UPDATE … WHERE status='open' RETURNING`; scope raffle `id` by `event_id`. |
| M4 | Med | `admin-pin/index.ts:567-591` | Instant win: count then insert separately → more winners than `winner_count`. | One RPC with row lock. |
| M5 | Med | `admin-management.tsx:291`, `admin-types.ts:50` | Tile reads `metrics.raffles`; server returns `dynamics` (`admin-pin:797`). Always "—". | Align names. |
| L8 | Low | `admin-dashboard.tsx:396` | `'home'` section has no nav entry; editor unreachable; `loadCards` still runs on login. | Add nav entry or delete. |
| L9 | Low | `admin-pin:368-703`, `lib/supabase/browser.ts` | `dynamicData` (~330 lines) has no client caller; browser client unused. | Delete or justify. |
| L10 | Low | admin client | 401 mid-session only shows a message; token stays. | 401 → `signOut()`. |
| L11 | Low | `horizontal-carousel.tsx:37` | `[children]` changes every render → re-subscribes each render. | `[]` + MutationObserver on the track. |

## Duplication

- Proxy routes ~90% identical → one helper (planned: `lib/admin-proxy.ts`).
- `requireSession`, `sha256`, `json`, `corsHeaders` copied in both edge functions → `supabase/functions/_shared/`.
- Fisher-Yates twice (`admin-pin:657-662`, `932-937`); SR26 event lookup 6×.
- Image upload in `record-editor.tsx:50-82` and `logo-carousel-admin.tsx:315-347` → `useImageUpload`.
- URL cleaning 3× (`community-carousel.tsx:5`, `logo-marquee.tsx:4`, `admin-logos:42`).
- `useCallback(callAdminApi, [])` (`admin-dashboard.tsx:59`) is a no-op: the function is module-level.

## `any` in `admin-pin/index.ts`

| Line | Concrete type |
|------|---------------|
| 103 | `ParticipantRow = { id; registration_code; first_name; last_name; status: string; other_running_group: string \| null; running_groups: { name: string } \| null }` |
| 387, 407 | `DynamicRow` (columns of the select at 381, `config: Record<string, unknown>`) |
| 388 | `{ dynamic_id: string; status: string }[]` |
| 637 | `{ registration_id: string }` |
| 676 | `ParticipantRow` |
| 795 | `{ running_group_id: string }` |
| 950 | `{ id: string }` |

Better long-term: `supabase gen types typescript` → `createClient<Database>()` and drop `// @ts-nocheck`.

## Not reviewed

Remote-only schema (`register_social_run_participant`, SECURITY DEFINER/`search_path`, RLS on all tables, FK cascades); whether the gateway rewrites `x-forwarded-for`; `verify_jwt` (no `supabase/config.toml`); `app/page.tsx`, `registration-form.tsx`, `record-editor.tsx` from line 120, CSS.
