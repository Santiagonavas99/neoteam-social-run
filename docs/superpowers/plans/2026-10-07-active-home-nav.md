# Plan — Active Home navigation

Spec: `docs/superpowers/specs/2026-10-07-active-home-nav-design.md`

Branch: `feat/active-home-nav`

Status: awaiting explicit OK.

Release: `0.28.0` if `main` remains on `0.27.0`.

## 1. Pass visible nav sections from Home

Files:
- `app/page.tsx`
- `components/site-header.tsx`

Changes:
- derive whether `story` and `agenda` are visible from the already-loaded Home section order;
- pass those anchors into the header;
- keep non-Home actions unchanged.

Checks:
- hiding Story removes Evento from nav;
- hiding Agenda removes Agenda from nav;
- reordering sections does not affect link correctness.

## 2. Add active-section observer

New file:
- `components/home-section-nav.tsx`

Changes:
- client component renders the visible Home anchor links;
- observe `#evento` and/or `#agenda` with `IntersectionObserver`;
- update one active key at a time based on actual visible target;
- set `aria-current="location"` on the active anchor;
- clean up observer on unmount.

Checks:
- Evento active while reading Evento;
- Agenda active while reading Agenda;
- no active anchor in Hero or after tracked section leaves the reading zone;
- works if Agenda appears before Evento.

## 3. Extend the existing nav visual state

Files:
- `app/globals.css`
- optionally `app/home-v2.css` only if Home-specific selector is required.

Changes:
- reuse existing cyan underline for `[aria-current="location"]`;
- active text uses high-emphasis header color;
- hover/focus styles continue to work;
- reduced-motion remains respected.

Checks:
- 390 px: no regression; anchor links remain hidden;
- 1024/1440 px: active underline stable during scroll;
- keyboard focus is still visually distinct.

## 4. Release

Files:
- `package.json`
- `CHANGELOG.md`

Changes:
- bump to `0.28.0`;
- document active sticky navigation and hidden-section awareness.

## Final verification

- `pnpm ci:check`;
- SQL tests;
- Vercel preview READY;
- test Home with both anchors visible;
- test Home with either section hidden if practical without mutating production configuration;
- no production merge until explicitly requested.
