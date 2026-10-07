# Home numbers and motion — plan

Spec: [`2026-10-07-home-numbers-design.md`](../specs/2026-10-07-home-numbers-design.md)

- **Branch:** `feat/home-numbers`, on top of `feat/pass-without-code` (0.13.0).
- **Release:** `0.14.0` (task 5).
- **Deploy:**
  1. the migration (dry run, then for real) **before** merging; until it exists, the home page hides the runner number;
  2. then Vercel. No edge functions.

Status: **approved** (Iván, 2026-10-07). Open questions settled by default: brands are counted from the logo strip, and the baseline of 20 is a constant in code.

## 1. `feat(db): registered runners count`

- **`supabase/migrations/<ts>_registered_count.sql`:** `public.social_run_registered_count()`:
  - `returns integer language sql stable security definer set search_path = ''`;
  - counts `public.registrations` joined to `public.events` with `code = 'SR26'` and `status <> 'cancelled'`;
  - `revoke all … from public`, then `grant execute … to anon, authenticated`.
- **`supabase/tests/registered_count.sql`:**
  - it creates the minimal `events` and `registrations` tables;
  - it checks that a cancelled registration is not counted;
  - it checks that `anon` can execute the function and cannot select `registrations`.
- **Checks:**
  - `pnpm test:db`, if Docker is up;
  - the remote dry run in `begin … rollback` returns 3.

## 2. `feat(home): numbers band with count-up`

- **`features/home/numbers.ts` + test:** `RUNNER_BASELINE = 20`, `runnersShown(count)`, and `countUpValue(target, progress)`, the ease-out step.
- **`features/home/data.ts`:** `getRegisteredCount()`, an RPC that returns `number | null` and logs on error.
- **`features/home/count-up.tsx`** (client):
  - an `IntersectionObserver` starts it once;
  - `requestAnimationFrame` writes the digits into a ref;
  - under reduced motion it does nothing;
  - the digits are `aria-hidden`, with an `sr-only` final number.
- **`features/home/sections/numbers.tsx`:** the band, with `+N` for runners (hidden when `null`) and `N` for brands (hidden when 0).
- **`app/page.tsx`:** loads the count next to the others and renders `<Numbers>` between Story and the logo strip.
- **`app/home-v2.css`:** band styles, mobile first.
- **Checks:**
  - 390 px, then 1440, light and dark;
  - the numbers count up once when scrolled into view;
  - with reduced motion they show the final value;
  - with JavaScript disabled they show the final value;
  - no horizontal scroll.

## 3. `feat(home): hero entrance and staggered reveals`

- **`app/home-v2.css`:**
  - the hero title lines rise into place (`@keyframes` with `translate` and `clip-path`, staggered by `--i`), and the meta, countdown and actions fade in after them;
  - the route card's top line;
  - all of it inside `@media (prefers-reduced-motion: no-preference)`.
- **`app/tailwind.css`:** `reveal` honours `animation-delay: calc(var(--i, 0) * 80ms)`.
- **`features/home/sections/hero.tsx`, `story.tsx` and `numbers.tsx`:** `style={{ '--i': n }}` on the staggered items.
- **`DESIGN.md`, rule 4:** the short hero load animation is allowed (transform and clip, under 900 ms).
- **Checks:**
  - a 390 px recording of the first load: the title is readable within 600 ms and there is no layout shift (CLS 0 in the Lighthouse mobile run);
  - reduced motion shows everything at rest.

## 4. `feat(home): arrow and press micro-interactions`

- **`app/globals.css`:**
  - `.button` and `.text-link` icons move `translate: 4px 0` on `:hover` and `:focus-visible`;
  - `.button:active` gets `translate: 0 1px`;
  - all of it under no-preference motion.
- **Checks:**
  - keyboard focus shows the same motion;
  - a touch tap shows the press.

## 5. `chore(release): 0.14.0`

- `package.json` goes to 0.14.0.
- The CHANGELOG section `[0.14.0] - <date>`:
  - **Added:** the runners and brands counters;
  - **Changed:** the home page motion.
- `CLAUDE.md`:
  - the function `social_run_registered_count` as a fourth narrow public read path;
  - the numbers band.
