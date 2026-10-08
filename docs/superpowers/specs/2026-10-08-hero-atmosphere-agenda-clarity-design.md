# Hero atmosphere and agenda clarity — design

Date: 2026-10-08
Branch: `feat/hero-atmosphere-agenda-clarity`
Release: 0.29.0

## Problem
The existing hero uses a repeating grid of vertical and horizontal lines, which competes with the main SOCIAL RUN typography. The hero metadata lacks a dedicated place chip. The agenda repeats the event date in the sticky board heading and its left-hand date signature, and appends a redundant footer note ("Parque del Ingenio, Cali · Los estados del día siguen los horarios programados.").

## Design decision
1. Keep the top hero date chip ("18 OCT · 2026") and the oversized agenda date signature on the lower left ("18", "OCT / DOMINGO", "2026 · CALI, COLOMBIA"). Use relevant information rather than another date in the sticky agenda board header: "5K / RUTA SOCIAL", preserving the activity count and hours on its right.
2. Keep the new separate mobile route section introduced on main; remove its duplicate 18 OCT label in favor of CALI, COLOMBIA. Keep the hero metadata's time ("07:30 A. M.") and distance ("5K SOCIAL"), and add "PARQUE DEL INGENIO" as a separate complementary chip with a MapPin icon. On narrow screens, arrange these four facts as two rows of two; ensure text wraps safely and remains readable.
3. Replace the CSS-grid background with one or two low-opacity cyan radial glows and an almost imperceptible fine-grain texture. Keep the hero black, typography, CTA, route-card and footer dividers; those two functional rules are sufficient. No extra animation.
4. Delete the footer note at the bottom of the agenda and its now-unused CSS.
5. Keep all copy in Spanish, focus, reveal, light/dark behavior and 60s ISR untouched.

## Mobile
Primary checks at 390px and 430px; no horizontal scrolling or clipped pills. At small widths, the fourth chip must not collide with the location. The two-column agenda board header must still fit above the timeline.

## Design, performance and accessibility
Use existing `--neo-*` tokens and CSS `color-mix()` for transparent cyan. The texture is a tiny SVG fractal-noise data URI in CSS (no network request, no JavaScript, no external image, no user content). The atmospheric overlays are decorative, do not intercept pointer events, and never cover actual content. No motion or new dependency; screen-reader meaningful content remains regular HTML.

## Alternative rejected
Do not replace the existing hero photograph-free editorial typography with new photography or animation; it adds loading cost and draws attention away from registration. Do not preserve the old repeating horizontal and vertical grid. Do not remove both date markers: the top event date and lower-left agenda signature serve different navigation contexts.

## Out of scope
Data collection/legal policies, registration, Wallet, Supabase, admin layout, agenda timing, event schedule, global typography and desktop navigation.
