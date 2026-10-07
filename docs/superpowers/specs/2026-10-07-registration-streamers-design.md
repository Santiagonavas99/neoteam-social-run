# Streamers on registration — spec

Date: 2026-10-07 · Branch: `feat/registration-streamers` · Status: **approved** (Iván, 2026-10-07)

## Problem

Iván, 2026-10-07: "poner serpentina cuando alguien se registre". Today the success screen ("¡Listo, …!", the pass) appears with no celebration.

## Decision

1. **A one-shot burst of streamers** when the success screen mounts (`state.ok` in `registration-form.tsx`). A new component, `features/registration/streamers.tsx`, renders it.
   - **Shape:** about 28 thin ribbons (6 × 18 px, 2 px radius) fall from the top of the viewport. Each one turns and sways as it falls, over about 2.4 s. Then they fade out and the layer unmounts.
   - **Colors:** the site's palette, every shade derived from the brand cyan (Iván, 2026-10-07: "con los colores de la paleta"):
     - `--neo-accent` (#03f8f6);
     - `--neo-accent-hover`;
     - `--neo-accent-border`;
     - `--neo-accent-text`;
     - `--neo-accent-dark`;
     - `--neo-black`.
     The dark shades keep the ribbons visible on the light theme, and the bright cyans keep them visible on the dark one. Landak purple is the studio's color, not the palette's, so it stays out.
2. **CSS only,** with one keyframe in `app/tailwind.css`, `streamer-fall`. The variables `--x`, `--delay`, `--spin` and `--drift` set each ribbon's position, delay, spin and drift. They come from its index, so every burst is the same and needs no `Math.random`.
3. **Off when the runner asks for less motion:** under `prefers-reduced-motion`, nothing renders (`motion-safe:`).
4. **Never in the way:**
   - the layer is `fixed inset-0`, `pointer-events-none` and `aria-hidden`;
   - it sits above the content (`z-50`) but never covers taps on the pass or the buttons;
   - it does not move the layout (CLS 0).

## Alternatives rejected

- **`canvas-confetti` or another library:** a new client dependency for an effect CSS covers.
- **Random positions on every render:** the burst would differ on each re-render, and it would be harder to test. Deterministic offsets look random enough.
- **Showing it on `/pase` too:** opening the pass is not a celebration. Only a new registration gets the burst.

## Design constraints

- DESIGN.md rule 4: it respects reduced motion, and it is not on the first screen of the site. It is a reaction to the runner's action, like the hero's load animation is a reaction to the page loading. DESIGN.md will name it next to the hero.
- Tokens only; no new icon.

## Mobile

- **Designed at 390 px:** the ribbons spread across the viewport width (`--x` in `vw`). The burst is about 28 small elements animating `transform` and `opacity` only, so it stays smooth on a mid-range phone.
- No horizontal scroll: `overflow: clip` on the layer.

## Out of scope

- Sound or vibration.
- Confetti anywhere else (admin draws, check-in).
