# Plan — Mobile hero alignment

Spec: `docs/superpowers/specs/2026-10-07-mobile-hero-alignment-design.md`

Branch: `fix/mobile-hero-alignment`

Status: **approved 2026-10-07**.

Release: `0.23.1`.

## 1. `fix(home): align mobile hero to one grid`

Files:
- `app/home-v2.css`

Changes:
- make `.v2-hero-meta` an intentional 2 + 1 grid at ≤760 px;
- remove the mobile `RUN` left offset;
- slightly reduce mobile title scale and keep the desktop scale untouched;
- tighten the meta → title vertical spacing;
- keep the hero side, actions and route card on the shared shell axis.

Checks:
- 390 px first, then 430 px;
- no horizontal overflow;
- screenshot comparison against the user-provided production capture;
- desktop 1440 px unchanged.

## 2. `fix(event): align countdown columns on mobile`

Files:
- `features/event/event-countdown.tsx`

Changes:
- use four equal columns at phone width instead of free flex gaps;
- restore the existing flex rhythm from `md` upward;
- preserve tabular digits, cyan seconds and screen-reader summary.

Checks:
- all four values/labels align at 390 px;
- live-event state remains unchanged;
- no hydration or countdown logic changes.

## 3. `chore(release): 0.23.1`

Files:
- `package.json`
- `CHANGELOG.md`

Changes:
- bump patch version to `0.23.1`;
- add a `Fixed` note for mobile hero alignment.

Final checks:
- `pnpm ci:check`;
- SQL tests;
- Vercel preview `READY`;
- no production deploy until explicitly requested.


### Final centering refinement

Approved in chat on 2026-10-07:
- center the mobile meta group;
- center kicker/title/copy/actions;
- center the countdown and each unit;
- center the route card as a block;
- keep desktop behavior unchanged.
