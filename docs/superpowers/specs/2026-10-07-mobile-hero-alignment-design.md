# Mobile hero alignment — design spec

Date: 2026-10-07 · Branch: `fix/mobile-hero-alignment`

Reference: production mobile screenshot shared by Santiago on 2026-10-07.

## Problem

The current mobile hero fits inside the viewport, but it does not read as one composition. Several elements use different horizontal logic:

- the meta pills wrap naturally, so their rows do not feel intentional;
- `RUN` keeps an 8% left offset inherited from the editorial desktop treatment;
- the countdown uses free-width flex items, so the four values do not form a stable column grid;
- the large title nearly consumes the shell width and amplifies small alignment differences;
- the vertical jump from meta pills to the eyebrow/title is larger than the rest of the rhythm.

The result is visually fragmented even though every individual block is technically responsive.

## Decision

At phone widths (≤760 px), the hero uses one explicit left alignment system based on the existing 16 px mobile shell.

### Header

The current mobile header remains unchanged. Logo, theme toggle and registration CTA already form a separate navigation row and should not be mixed into the hero content grid.

### Meta row

Replace free wrapping with an intentional two-column mobile grid:

- row 1: date + time;
- row 2: `5K SOCIAL` starting at the same left edge;
- compact 8 px gaps;
- pills keep content-driven width rather than stretching to equal widths.

This keeps the event facts grouped without looking accidental.

### Hero title

- `ANIVERSARIO NEOTEAM`, `SOCIAL` and `RUN` share the exact same left edge.
- Remove the mobile-only `margin-left` from `RUN`.
- Reduce the phone title scale slightly from the current 27vw treatment so `SOCIAL` has deliberate breathing room inside the shell.
- Keep the cyan `RUN` treatment and the existing clipped entrance animation.

The desktop offset remains unchanged above the mobile breakpoint.

### Supporting copy

The supporting sentence stays left aligned and full-width within the same shell. No centered copy.

### Countdown

On phones, the four countdown units become a four-column grid spanning the available hero width:

- equal-width columns;
- values and labels align vertically;
- `FALTAN` stays on the shared left edge;
- seconds remain cyan;
- from `md` upward, the existing compact horizontal desktop treatment can remain.

This removes the irregular visual spacing produced by free flex gaps.

### Actions and route card

Actions and the 5K route card keep their current structure, but inherit the same shell alignment. No new centering or inset is introduced.

### Vertical rhythm

Tighten the gap between meta facts and the hero title on mobile so the top half reads as one grouped event header rather than two disconnected zones.

## Why

The hero is intentionally editorial and asymmetric on desktop, but the phone viewport cannot sustain multiple independent offsets. A single mobile alignment axis preserves the brand character while making the hierarchy easier to scan.

## Alternatives rejected

- **Centering the whole hero:** would weaken the current editorial identity and make long supporting copy harder to read.
- **Equal-width meta pills:** creates unnecessary empty space and makes short labels feel like form controls.
- **Keeping the RUN indent but moving other blocks:** preserves the source of the misalignment instead of solving it.
- **Shrinking everything:** the issue is structure, not merely size.

## Mobile

Primary validation: 390×844.

At 390 px:
- no horizontal overflow;
- date and time stay on the first row, 5K starts on row two;
- eyebrow, SOCIAL, RUN, supporting copy, FALTAN and the countdown share the same shell axis;
- SOCIAL does not touch the right edge;
- countdown values occupy four stable equal columns;
- registration header remains usable with 44 px touch targets.

Also verify 430 px, 768 px and 1440 px to ensure the desktop editorial layout is unchanged.

## Accessibility

No semantic changes. Existing labels, countdown screen-reader summary and reduced-motion behavior stay intact.

## Performance

CSS/layout-only changes plus class changes in the existing countdown component. No dependencies and no new client behavior.

## Security

No auth, API, Supabase, QR or data changes.

## Out of scope

- Redesigning the header.
- Changing hero copy.
- Changing the desktop hero composition.
- Reworking the rest of the landing page.
