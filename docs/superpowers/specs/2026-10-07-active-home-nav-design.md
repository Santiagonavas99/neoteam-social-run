# Active Home navigation — design spec

Date: 2026-10-07 · Branch: `feat/active-home-nav`

## Goal

Make the sticky public navigation communicate where the user is on the Home, rather than behaving like a static set of jump links.

The active state should be useful, restrained and consistent with NeoTeam's editorial/cyan language.

## Current context

The Home header currently contains:
- Evento → `/#evento`;
- Agenda → `/#agenda`;
- Mi pase → `/pase`;
- theme toggle;
- Registrarme.

Only Evento and Agenda are in-page section links.

Both corresponding Home sections are configurable through `home_section_order`, including visibility and order.

## Decision

### Active section

Track only the Home anchor sections represented in the nav:
- `evento`;
- `agenda`.

Use `IntersectionObserver`, not a scroll event listener.

A section becomes active when its content enters the reading zone below the sticky header.

The observer uses a vertical activation band approximately around the upper-middle viewport:
- top offset accounts for the sticky header;
- bottom root margin makes the active state switch before the next section is already mostly past.

If neither tracked section is meaningfully in the reading zone, no anchor is marked active.

### Visual state

The existing cyan hover/focus underline becomes persistent for the active section.

Active link:
- white/high-emphasis text;
- cyan 1 px underline fully revealed;
- `aria-current="location"`.

Inactive links retain the current secondary text color.

No pill, filled background or large movement: the sticky bar should remain visually calm.

### Dynamic visibility

The Home already knows which configurable sections are visible.

Pass that information into `SiteHeader` so:
- hide `Evento` if `story` is hidden;
- hide `Agenda` if `agenda` is hidden.

This prevents dead anchor links and keeps the navigation consistent with admin configuration.

`Mi pase`, theme toggle and `Registrarme` remain always available.

### Reordering

If Evento and Agenda are reordered from admin, active tracking still follows the actual DOM positions.

No assumption is made that Evento comes before Agenda.

## Architecture

Keep `SiteHeader` primarily server-rendered.

Add a small client component for Home anchor navigation, for example:
`components/home-section-nav.tsx`.

Responsibilities:
- receive the visible anchor definitions from the server;
- observe the corresponding section elements;
- render the anchor links;
- manage `aria-current`.

This avoids making the entire header/theme/brand component client-side.

## Mobile

At the existing mobile breakpoint, Home section text links remain hidden as they are today.

No new mobile navigation pattern is introduced in this release.

The observer may still mount, but the component should avoid unnecessary work when no visible anchor links are rendered at that breakpoint if practical.

## Motion

Reuse the existing underline transition.

No new scroll animation, parallax or moving indicator.

With `prefers-reduced-motion`, the active state still changes because it conveys location; only transition animation may become instant according to existing motion rules.

## Accessibility

- active section anchor uses `aria-current="location"`;
- keyboard focus remains visible and independent of active state;
- active state is not encoded by color alone because the underline remains visible;
- hidden Home sections produce no dead nav link.

## Performance

Two observed targets maximum.

No scroll handlers and no dependency changes.

## Release

New public navigation behavior → minor version `0.28.0`, assuming current baseline remains `0.27.0`.

## Out of scope

- mobile hamburger or sheet nav;
- route-active styling for Mi pase;
- progress percentage;
- active states for every configurable Home section;
- URL hash replacement while scrolling;
- analytics events.
