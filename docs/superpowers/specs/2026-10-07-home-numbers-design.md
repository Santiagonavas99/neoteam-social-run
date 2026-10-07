# Home numbers and motion — spec

Date: 2026-10-07 · Branch: `feat/home-numbers` · Status: **approved** (Iván, 2026-10-07)

## Problem

Iván, 2026-10-07, three requests:
1. "mejorar las animaciones de la página principal";
2. show the number of associated brands;
3. show the number of registered runners, starting at 20 plus the real registrations, with a count-up animation.

Today the home page has two kinds of motion:
- a fade-up `reveal` as sections scroll in;
- the logo marquee.

The first screen has no motion at all. Neither number is shown anywhere.

**Data today** (remote, 2026-10-07):
- 3 registrations that are not cancelled;
- 7 active logos in the strip (`home_logo_carousel_items`);
- the `brands` table has only one row, the organizer.

## Decisions

1. **A "numbers" band** (`features/home/sections/numbers.tsx`), between Story and the logo strip, so the brand count sits right above the logos it counts:
   - **`+23` CORREDORES INSCRITOS:** 20 plus the real count. The 20 is a constant, `RUNNER_BASELINE`, in `features/home/numbers.ts`;
   - **`7` MARCAS ALIADAS:** the number of active logos in the strip. That is what visitors see as "the brands", and the page already loads them.
   - **Type:** large, like the final section's date: Host Grotesk 800, about 96 px on a phone and 160 px from `md`, in two columns from `md`.
   - **Order:** the label goes under the number. The `+` is drawn in `--neo-accent-text`.
2. **The runner count comes from a new Postgres function,** because the browser and the publishable key cannot read `registrations` (RLS):
   - `public.social_run_registered_count()`: `security definer`, `stable`, returns `integer`;
   - it counts the event `SR26` registrations whose status is not `cancelled`;
   - `execute` is granted to `anon` only.
   - It returns a single number, with no names, emails or ids.
   - The migration is `supabase/migrations/<ts>_registered_count.sql`, and it comes with a SQL test.
   - **Loader:** `getRegisteredCount()` in `features/home/data.ts`. If the call fails, the runner number is hidden; the brand number still shows.
3. **Count-up:** `features/home/count-up.tsx`, a small client component.
   - **Server side:** it renders the final number, so it shows without JavaScript, to crawlers and on a failed load.
   - **When the band scrolls into view** (`IntersectionObserver`), it counts from 0 to the number in about 1.2 s with an ease-out curve, once.
   - **Reduced motion:** it keeps the final number and never animates.
   - **Accessibility:** the animated digits are `aria-hidden`, and a visually hidden copy holds the final number, so screen readers do not hear every step.
   - The pure easing and step function goes in `count-up.ts`, with a test.
4. **Better motion on the home page,** CSS only with no new dependency. All of it is off under `prefers-reduced-motion`.
   - **Hero entrance:** the "SOCIAL" and "RUN" lines rise into place in order (`translate` plus `clip-path`, 600 ms, 80 ms apart). The meta pills, the countdown and the call to action fade in after them. The whole sequence is under 900 ms.
     - The title is never hidden by `opacity`, so it still counts as the page's largest paint; it is only clipped as it rises.
     - Scroll reveals stay off the first screen (DESIGN.md rule 4); this is a load animation, which DESIGN.md will name as such.
   - **Staggered reveals:**
     - each agenda item already reveals on its own;
     - the Story facts and the numbers each reveal with a small delay per position (`--i`), instead of all at once.
   - **Buttons and links:** the arrow in "Quiero participar", "Quiero estar ahí" and the other text links moves 4 px on hover and focus, and the button presses down 1 px when tapped (`:active`).
   - **Hero route card:** a slow line runs along its top edge once on load, like a runner's path. It is a decorative `::after`.

## Alternatives rejected

- **Counting from the `brands` table:** it has one row today (the organizer), so the number would read "0 marcas".
- **An animation library (Framer Motion, GSAP):** it adds a client dependency for effects that CSS and about 40 lines of JavaScript cover. Phones on 4G matter more.
- **Counting on every frame with a React state:** the component writes the number with `requestAnimationFrame` into a ref, so it does not re-render 60 times a second.
- **Starting the counter at the baseline (20 → 23):** almost no motion. It counts from 0.
- **Reading the count with the service role on Vercel:** it would add a new secret to Vercel. A narrow `security definer` function is enough.

## Design constraints

- Tokens only. The new home styles go in `app/home-v2.css` or Tailwind utilities, mobile first with `min-width` queries.
- Text is at least 12 px.
- Icons: none are needed; the numbers carry the section.
- **DESIGN.md, rule 4:** a short load animation is allowed on the hero, transform and clip only. Scroll reveals still never run on the first screen.

## Mobile

- **Designed at 390 px first:**
  - the numbers band is one column, each number about 96 px;
  - no horizontal scroll while the numbers grow, because the width is reserved with `tabular-nums` and a `min-width` in `ch` sized to the final number.
- **Cost:** about 1 KB of client JavaScript for the count-up. Everything else is CSS. There is one extra RPC per home render, a single `count(*)`.
- **Reduced motion and older browsers:** numbers and content appear at rest.

## Security

- The function exposes only an aggregate count, which a public "N corredores inscritos" shows anyway.
- It runs as its owner (`security definer`), with `set search_path = ''` and fully qualified names.
- Only `execute` is granted.
- Remote: Iván approves, then it is applied with a `begin … rollback` dry run first, as before.

## Out of scope

- Live updates of the counter without reloading.
- Stats in the admin.
- Reworking the community carousels.
