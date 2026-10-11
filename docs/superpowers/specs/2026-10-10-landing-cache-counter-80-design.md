# Landing: back to the CDN cache, counter floor at 80

## Problem

1. The landing is slow. `app/page.tsx` has `export const dynamic = 'force-dynamic'` since bb8066a
   (2026-10-09), which undid 5865242 (`perf(home): serve the home page from the cache`). Every
   visit now renders on a Vercel function (cold start included) and waits for the slowest of
   seven parallel Supabase queries (two logo carousels, groups, brands, section order,
   registered count, registration settings) before sending any HTML. Measured on production:
   `x-vercel-cache: MISS` on every request, TTFB 0.56–0.92 s; worse on 4G.
2. The public counter should start at "+80 corredores" and the count only needs refreshing
   once a day.

## Decision

- Remove `force-dynamic` and use `export const revalidate = 60` (ISR, as in 5865242). Verified
  viable: nothing under `/` calls `headers()`/`cookies()` and `cacheComponents` is off.
- `RUNNER_COUNT_FLOOR` 50 → 80.
- Cache the registered-count RPC for 24 h on the server with `unstable_cache`
  (`revalidate: 86400`). Only the RPC call is cached; it throws on failure, so a Supabase error
  is never stored for a day. The `catch` → `null` fallback stays outside the cache.

## Why a cached page is safe for the registration state

`force-dynamic` was added so the open/closed CTA would never come from stale HTML. It is not
needed:

- The deadline is evaluated in the browser with the live clock
  (`landingRegistrationState(settings, now)`, `now` ticks every second). HTML cached before
  the deadline flips to "Inscripciones cerradas" at the exact minute, with no request.
- A manual close (`registration_open = false`) is picked up by `LandingRegistrationProvider`'s
  fetch of `/api/registration-status` (no-store) on mount, every 15 s and on tab focus. The only
  lag is the mount fetch, a few hundred ms after first paint.
- The database enforces the cutoff regardless of what the CTA shows.

`page.tsx` gets a comment saying this, so the setting is not flipped a third time.

## Alternative rejected: localStorage

The counter is rendered on the server into the HTML; the browser never queries it. localStorage
cannot skip a query that happens before the page reaches the browser, and it would make each
visitor see a different number. A 24 h server cache does what "check once a day" intends, for
everyone.

## Mobile

No visual change. Mobile benefits most: HTML comes from the CDN edge instead of a function plus
Supabase over 4G.

## Security

Unchanged: same publishable-key server reads, same aggregate RPC.

## Out of scope

- The 15 s `/api/registration-status` poll per open tab (function load, not first paint).
- Image/JS weight audit (Lighthouse) — after TTFB is fixed, if the page still feels slow.
