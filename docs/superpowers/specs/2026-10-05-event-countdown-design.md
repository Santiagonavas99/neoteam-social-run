# Event countdown — spec

Date: 2026-10-05 · Branch: `feat/tailwind-and-icons` (Task 3b of its plan) · Status: **approved 2026-10-05** · Must ship before 18 Oct 2026 (it has no use after).

## Problem

The home shows the date ("18 OCT · 2026") but not how close it is. Iván wants a countdown next to the date, to add urgency to the registration call to action in the last two weeks.

## Design review

- `DESIGN.md`: tokens only, text ≥ 12 px, motion respects `prefers-reduced-motion`, copy in Spanish sentence case.
- `frontend-design` skill: the hero is the thesis (the huge "SOCIAL RUN" title on black, the green accent). The countdown borrows from the subject's own world: a **race start clock**, the big digital timer at a start line. Tabular digits in Host Grotesk 800, units under each block, seconds in the accent green as the one moving thing. No boxes, glows or flip animations: the hero title stays the signature, the clock is quiet next to it.

## Decisions

1. **Target:** the meeting time, 18 Oct 2026 07:30 Colombia time, stored once as `eventConfig.startsAt = '2026-10-18T07:30:00-05:00'` in `lib/event.ts` (Colombia has no daylight saving, so a fixed offset is exact). `eventConfig.endsAt = '2026-10-18T11:00:00-05:00'` (closing and photos start 10:30). Wallet passes and the check-in screen reuse these later.
2. **Three states:**
   - before the start: `FALTAN` + `DD días · HH h · MM min · SS s`;
   - between start and end: "EN CURSO" with a live dot (pulses only under `motion-safe`), "Nos vemos en el Parque del Ingenio";
   - after the end: the countdown is not rendered; the date stays.
3. **Placement:** in the hero side column, between the headline and the "Quiero participar" button, so the time left sits next to the action. The date pill stays as it is ("aparte de la fecha").
4. **Rendering:** the page is already `force-dynamic`, so the server renders the current values (no empty box, works without JS, no layout shift). A client component then ticks every second, recomputing from `Date.now()` each time (no drift when the tab sleeps). The digits use `suppressHydrationWarning`, because the second can change between server and client render.
5. **Logic in a pure function** `lib/countdown.ts`: `countdown(nowMs, startMs, endMs)` returns `{ state: 'upcoming', days, hours, minutes, seconds } | { state: 'live' } | { state: 'ended' }`, tested at the boundaries.
6. **Accessibility:** the digits are `aria-hidden`; a visually hidden sentence ("Faltan 12 días y 14 horas para el encuentro") carries the meaning and is not a live region, so screen readers are not interrupted every second.
7. **Styling:** Tailwind utilities on tokens (`text-neo-accent`, `tabular-nums`), in the new component only; no legacy CSS touched. Needs Tasks 1–2 of the plan.

Rejected:
- A countdown library or Temporal: four subtractions on `Date.now()`; see the Tailwind spec, decision 9.
- Days only ("Faltan 12 días"): Iván asked for a countdown; seconds make it feel live, and they cost one interval.
- Flip-clock animation: decoration that competes with the hero title, and motion for its own sake.

## Mobile

Designed at 390 px first: four blocks on one line (`DD HH MM SS`, each about 64 px wide, digits 34 px, units 12 px), no wrapping down to 360 px. It must be visible without scrolling at 390×844 together with the CTA. If the hero side column falls below the fold on phones, the clock moves directly under the meta pills on mobile only (`order-*`), and stays next to the CTA on desktop. Runs on the main thread once per second: negligible on a mid-range phone; the interval is cleared on unmount.

## Out of scope

The countdown on `/registro` (one line to add later if Iván wants it), the post-event page, time-zone conversion for visitors outside Colombia (the event is local; the clock counts real time left, which is correct in any zone).
