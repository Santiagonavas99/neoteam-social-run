# Sticky public navigation — design spec

Date: 2026-10-07 · Branch: `feat/sticky-site-header`

## Problem

The public navigation currently lives inside the Hero. Once the user scrolls beyond the Hero, the navigation disappears, so links such as Evento, Agenda, Invitados, Mi pase and Registrarme are no longer immediately available.

A simple `position: sticky` on the existing header is not sufficient because the header is a child of the Hero; it would stop sticking when the Hero's scroll area ends.

## Decision

Move the public `SiteHeader` out of the Hero and make it a sticky, full-width top-level element of the Home.

### Structure

- `app/page.tsx` renders `<SiteHeader />` before `<Hero />`.
- `Hero` no longer owns the header.
- `SiteHeader` becomes a full-width sticky shell with a constrained `.site-header-inner` that preserves the existing 1280 px content width.
- The header stays in normal document flow, so no spacer or manual top padding is needed.

### Sticky behavior

- `position: sticky`;
- `top: 0`;
- high enough z-index to stay above every Home section;
- always-dark NeoTeam surface;
- subtle translucent/blurred treatment while preserving the existing black visual language;
- existing bottom hairline remains.

The bar remains visible during the entire page scroll.

### Hero adjustment

Because the header moves outside the Hero:
- the Hero background grid begins at the Hero itself instead of 84 px below an internal header;
- the Hero minimum height becomes viewport height minus the desktop header height so the first-screen composition remains balanced;
- on phone, the same adjustment uses the existing 72 px header height.

### Anchors

Sticky navigation must not cover section headings after clicking:
- `#evento`, `#agenda`, and `#invitados` receive scroll margin equal to the sticky header height plus a small breathing offset.

### Mobile

At ≤800 px the text nav links are already hidden, so the sticky bar contains:
- logo;
- theme switch;
- registration CTA.

The mobile bar remains 72 px high at ≤560 px and must not cover content or create horizontal overflow.

Primary checks:
- 390 px;
- 1024 px;
- 1440 px.

### Accessibility

No semantic nav changes. Existing keyboard navigation and focus behavior remain intact.

### Performance

CSS/layout-only behavior plus moving existing component ownership. No dependency or scroll listener.

## Why

Moving the header outside the Hero lets native CSS sticky behavior work for the whole page without JavaScript, fixed-position spacers, or scroll event logic.

## Alternatives rejected

- **`position: fixed` inside Hero:** removes the header from flow and requires manual spacing; easier to introduce overlap bugs.
- **Sticky header left inside Hero:** stops sticking once the Hero ends.
- **JavaScript scroll listener:** unnecessary for a behavior CSS already handles.
- **Floating compact nav after scroll:** larger redesign than requested.

## Security

No auth, data, Supabase or API changes.

## Out of scope

- Active-section highlighting.
- Hiding/revealing the header based on scroll direction.
- Changing nav labels or destinations.
- Redesigning the mobile header.
