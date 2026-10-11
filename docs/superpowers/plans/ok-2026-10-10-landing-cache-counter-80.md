# Plan: landing cache + counter floor 80

Spec: `docs/superpowers/specs/2026-10-10-landing-cache-counter-80-design.md`
Branch: `perf/landing-cache-counter-80`

1. **perf(home): serve the landing from the CDN cache again** — `app/page.tsx`: replace
   `dynamic = 'force-dynamic'` with `revalidate = 60`; the comment must state that the CTA
   state is computed client-side with the live clock and refreshed from
   `/api/registration-status`, so a cached page is safe.
   Check: `pnpm build` lists `/` as ISR (revalidate 1m), not ƒ dynamic.
2. **feat(home): runner counter floor at 80, count refreshed daily** —
   `features/home/numbers.ts` (`RUNNER_COUNT_FLOOR = 80`); `features/home/numbers.test.ts`
   (floor cases up to 80, and 81 → 81); `features/home/data.ts`: wrap only the
   `supabase.rpc('social_run_registered_count')` call in `unstable_cache(..., ['registered-count'],
   { revalidate: 86400 })`, throwing on `error` so failures are not cached, `catch` stays outside.
   Check: `pnpm test`.
3. **chore(release): 0.35.0** — `package.json` + `CHANGELOG.md` (Changed: landing servida desde
   caché, contador desde +80 actualizado una vez al día).

Checks: `pnpm ci:check`; at 390 px the landing shows "+80 Corredores inscritos" and the CTA
reflects the live registration state; after deploy, a second `curl -I` returns
`x-vercel-cache: HIT` with TTFB well under 100 ms.
