# Home refresh: theme, logo strip, agenda, motion — spec

Date: 2026-10-06 · Branch: `feat/home-refresh` (from `main`, which has the cyan palette and `lib/theme.ts` since PR #23) · Status: **approved** (Iván, 2026-10-06)

Design study: [`design/2026-10-06-home-refresh.html`](../../../design/2026-10-06-home-refresh.html), published as a private artifact for Iván.

## Problem

Iván, 2026-10-06:
- the home has no theme switch;
- the logo strip looks dated, and its logos are small;
- the agenda's layout does not work;
- he wants motion on scroll;
- he wants a review of the sections and their distribution.

Measured at 390 / 1440 px (screenshots in the study):
- **Logo strip:** logos render at 120×48 / 178×60 px, inside a thin white band with large gaps.
- **Agenda:**
  - 2,516 / 1,693 px tall;
  - its cards are staggered and leave an empty column on desktop;
  - the 01–07 numbers repeat what the times already say.
- **Community (crews and brands):** never renders. The server logs `permission denied for table running_groups` (hint: `GRANT SELECT … TO anon`), and the Next dev overlay shows "Home community fallback {}".
- **Dark mode:** `home-v2.css` still has 31 hard-coded colors, and the public CSS paints surfaces with absolute black and white. A switch today would leave half the page light.

## Decisions

1. **Theme on the public pages,** reusing `lib/theme.ts`:
   - The theme root moves from `app/admin/layout.tsx` up to `app/layout.tsx` (`<html data-theme>` plus the pre-paint script), so the home, `/registro`, `/pase` and the admin share one choice and one storage key.
   - The key is renamed `neoteam_theme`; the old admin key is read once as a fallback.
   - **Header:** a 44 px icon button next to "Registrarme". It shows the current theme (`Sun` / `Moon` / `Monitor`) and opens a three-option menu.
     - The menu is a native `popover` element, so Escape and light dismiss come free, with no library.
     - The admin keeps its segmented switch.
   - **The hero stays black in both themes.** The other sections follow the tokens.
2. **The 31 colors in `home-v2.css` go to tokens,** together with the absolute surfaces (`--neo-white`/`--neo-black` used as page surfaces) in `globals.css`. The hero, header and footer keep `--neo-black` on purpose: they are always dark.
3. **Logo strip:**
   - **Tiles:** white, 148×88 on phones and 200×112 from `md`, with a 14 px radius and a hairline border. They stay white in dark mode, because most logos are dark marks.
   - **Color and motion:**
     - logos are grayscale at 85% opacity and turn full color on hover or focus;
     - the strip pauses on hover;
     - its edges fade out with `mask-image`.
   - **Label:** "Marcas aliadas", in place of an unlabeled band.
   - **Reduced motion:** with `prefers-reduced-motion`, the animation stops and the strip scrolls by hand instead.
4. **Agenda as a timeline** (`<ol>`):
   - each item shows the time with its meridiem, a dot on a vertical rail, then the title and a one-line summary;
   - "Ruta 5K" and "Celebración y rifas" get a cyan dot and accent text;
   - on desktop the heading is sticky on the left, with the timeline on the right;
   - the 01–07 numbers go;
   - the details come from `features/event/event.ts`, with no copy duplicated.
5. **Scroll reveal, CSS only:**
   - a Tailwind `@utility reveal` in `app/tailwind.css` uses `animation-timeline: view()`: a fade-up of 24 px as the element enters;
   - it applies only inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`;
   - it goes on section heads, timeline items and logo tiles;
   - no JavaScript and no dependency. Browsers without support show everything still and complete.
6. **Sections:**
   - **"El plan":** the three facts become a row with icons on phones.
   - **Rifas:** the right panel goes from petrol green to brand black.
   - **Footer:** gains links to Registro, Mi pase and Agenda.
7. **Community data:** a migration grants `SELECT` on `running_groups` and `brands` to `anon`, with RLS policies limited to `active and show_on_home`.
   - It is written only after Iván runs the read-only check (grants and policies), because the remote schema is the source of truth.
   - `features/home/data.ts` logs `error.message` instead of `{}`.

## Alternatives rejected

- **A JS IntersectionObserver for the reveal:** more code, and hydration-sensitive. Scroll-driven CSS degrades to "no animation" by itself.
- **A motion library:** a new client dependency on a page where most visitors arrive over 4G.
- **Cycling the theme on each tap:** the user cannot see which state comes next. The menu names all three.

## Mobile

- Everything is designed at 390 px first.
- **Touch targets:** the theme button, the menu options and the footer links are at least 44 px.
- **Agenda:** about 900 px on phones, down from 2,516.
- **Motion:** paused or removed under reduced motion; transforms and opacity only, nothing that triggers layout.

## Security

- The new grants expose only rows the home already shows publicly (`active and show_on_home`) and only the columns it selects.
- No new environment variable or secret.

## Out of scope

- `/registro` and `/pase` layouts. They only gain the theme.
- Event copy changes.
