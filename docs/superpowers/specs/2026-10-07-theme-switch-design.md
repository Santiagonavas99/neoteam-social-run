# Theme switch with an animated change — spec

Date: 2026-10-07 · Branch: `feat/theme-switch` · Status: **approved** (Iván, 2026-10-07)

## Problem

Iván, 2026-10-07: "en pantallas muy grandes el botón de cambiar tema se queda a la izquierda del todo y no funciona; que en lugar de un desplegable sea un switch y que haga una animación de cambio de tema".

**What the code does today:** the public header (`components/site-header.tsx`) has `ThemeMenu`. It is a button that opens a native popover (`<fieldset popover>`) with Claro, Oscuro and Sistema. The popover's position (`top` and `right`) is computed in the button's `onClick`, the same click that opens it.
- **Chromium:** it opens under the button at 390, 1440, 1920 and 2560 px, and changing the theme works.
- **Safari is the likely failure.** If the popover opens before `place()` runs, or the position is lost, it sits at its default spot, the left edge, which matches what Iván sees. WebKit is not installed for Playwright here, so this is the likely cause, not a confirmed one. Removing the floating menu removes the whole class of problem.

## Decision

Iván, 2026-10-07, chose "claro/oscuro con auto inicial".

1. **A two-position switch replaces the menu in the public header.** It lives in `components/theme-toggle.tsx`; `theme-menu.tsx` is deleted.
   - **Track:** a pill about 56 × 32 px with a round thumb that slides. The `Sun` icon shows on the light side and `Moon` on the dark side; the thumb carries the current icon.
   - **Hit area:** 44 px tall, as every touch target.
   - **Semantics:** `<button role="switch" aria-checked={dark}>`, labelled "Modo oscuro". Space and Enter toggle it, it has a visible focus ring, and it uses the `on-dark` tokens, because the header is always black.
   - **First visit follows the device (auto):** with no stored choice, the switch shows the device's theme and keeps following it if the device changes.
   - **After the first tap**, the choice is stored (`neoteam_theme`) as light or dark, as today.
   - **There is no way back to "auto" from the header**, which Iván accepted. The admin keeps its three-way selector (`features/admin/shell/theme-switch.tsx`), which still offers Sistema.
2. **`useThemeChoice` also returns the resolved theme** (light or dark), so the switch shows the real state while the choice is still "system". The admin keeps using the hook as is.
3. **The theme change is animated: a circle that grows from the switch.**
   - **How:** the View Transitions API. `document.startViewTransition` swaps `data-theme`, then `element.animate` grows a `clip-path: circle()` on `::view-transition-new(root)` from the center of the switch until it covers the screen. It takes about 450 ms with an ease-out curve.
   - **CSS:** two rules turn off the default cross-fade (`::view-transition-old(root)`, `::view-transition-new(root)`).
   - **Fallbacks:** browsers without View Transitions (Firefox before 144, Safari before 18) and `prefers-reduced-motion` change instantly, as today.
   - **What moves:** the thumb also slides, 200 ms, `transform` only.
   - **A cyan ring rides the edge of the circle.** This was added during implementation (Iván, 2026-10-07: "onda cian + círculo").
     - **Why:** the hero is black in both themes and fills the first screen, so the circle alone grows "black over black" and can hardly be seen where the switch is.
     - **How:** a 2 px ring in `--neo-accent` grows from the switch with the same timing and curve as the circle. Its outer edge follows the circle's edge, and it fades out over the last third. It is drawn inside the new theme's live snapshot, so it shows on the hero and on light sections alike.
     - **Lifetime:** it is removed when the transition ends.

## Alternatives rejected

- **A three-position switch (claro · auto · oscuro):** at 390 px it does not fit next to the logo and "Registrarme" with 44 px targets.
- **Keeping the popover and fixing its position with CSS anchor positioning:** not supported in every browser yet, and Iván asked for a switch.
- **Animating every color with a CSS transition on `*`:** it repaints the whole page, stutters on mid-range phones and fights the scroll reveals. A view transition is one composited snapshot.

## Design constraints

- **Icons:** `Sun` / `Moon` keep their meaning (theme: light / dark), and `Monitor` stays in the admin only. The DESIGN.md icon table does not change.
- **Motion:** DESIGN.md rule 4 gets the theme transition as the one other animation that reacts to a tap, and it respects reduced motion.
- **Tokens only.**

## Mobile

- **At 390 px:** the switch, about 56 px wide, sits between the logo and "Registrarme" without wrapping or scrolling sideways. Its hit area is 44 px tall.
- **The circle grows from where the thumb is.** It is one snapshot animated on the compositor, so it stays smooth on a mid-range phone.
- **Also checked at 1440, 1920 and 2560 px:** the switch stays inside the header's content width, next to "Registrarme".

## Out of scope

- **Adding the switch to `/registro` and `/pase`:** they do not use `SiteHeader`, so they keep their current headers.
- Changing the admin's selector.
