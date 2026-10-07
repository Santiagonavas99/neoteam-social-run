# Plan — Mobile live experience

Spec: `docs/superpowers/specs/2026-10-07-mobile-live-experience-design.md`

Branch: `feat/mobile-live-experience`

Status: **approved 2026-10-07**.

Release: `0.28.0` if `main` remains on `0.27.0`.

## 1. Introduce machine-readable event/agenda timing

Files:
- `features/event/event.ts`
- new pure helper + tests under `features/event/`

Changes:
- add ISO timestamps/start values to agenda items;
- add a pure helper that derives pre-event / current / next / finished state from a supplied `Date`;
- unit-test boundaries around 07:30, each checkpoint and 11:00.

No copy/parser logic may depend on `a. m.` display strings.

## 2. Build the mobile live Agenda state

Files:
- `features/home/sections/agenda.tsx`
- new small client component for live agenda state;
- `app/home-v2.css` or Tailwind utilities adjacent to the component.

Changes:
- add contextual live card;
- mark current / next / past timeline rows;
- animate current checkpoint ring and progress rail;
- update state approximately once per minute;
- polite live region for current-state changes;
- preserve desktop editorial layout.

Checks:
- pre-event;
- event day before start;
- each current/next boundary;
- post-event;
- 390, 1024, 1440;
- reduced motion.

## 3. Add section-arrival index motion

Files:
- `app/home-v2.css`
- `DESIGN.md` motion guidance if a reusable pattern is introduced.

Changes:
- animate `.v2-index` with one entrance + cyan sweep using scroll-driven CSS;
- ensure anchor jumps also show the arrival state;
- do not move the section layout itself.

Checks:
- Story / Agenda / Community / Raffle / Final;
- no replay jitter;
- static fallback;
- reduced motion.

## 4. Turn registration into a 3-step wizard

Files:
- `features/registration/registration-form.tsx`
- `features/registration/form-ui.tsx`
- new wizard/progress helper and tests if useful.

Changes:
- Step 1 Tus datos;
- Step 2 Crew y seguridad;
- Step 3 Confirmación/review + consents;
- per-step browser validation;
- Back / Continue controls;
- preserve form values between steps;
- map server errors back to the first invalid step;
- animate step direction and progress segments;
- final server action/payload stays unchanged.

Checks at 390 px first:
- forward/back;
- `Otro crew`;
- validation prevents advancing;
- values survive back/forward;
- server errors reopen correct step;
- keyboard/focus;
- no horizontal overflow;
- successful registration/pass remains unchanged.

## 5. Add responsive event-status badge to sticky header

Files:
- `components/site-header.tsx`
- new client `event-status.tsx` or equivalent;
- header CSS.

Changes:
- `18 OCT` before event date;
- `HOY` event day before start;
- `EN VIVO` during event;
- `FINALIZADO` after;
- cyan dot, slow pulse only while live;
- fit cleanly at 390 px with brand + controls.

Checks:
- exact boundary states;
- no mobile squeeze/overflow;
- reduced motion removes pulse.

## 6. Harmonize motion

Files:
- `DESIGN.md`;
- relevant Home/registration styles.

Changes:
- document Pulse / Tick / Slide / Sweep vocabulary;
- cap looping elements;
- add subtle hero metadata stagger and agenda dot stagger only if they remain within the motion hierarchy;
- verify existing Streamers and theme animation are not duplicated.

## 7. Release

Files:
- `package.json`
- `CHANGELOG.md`

Changes:
- bump to `0.28.0`;
- document live agenda, registration wizard, event status and coordinated motion.

Final:
- `pnpm ci:check`;
- SQL tests;
- Vercel preview READY;
- mobile visual review at 390 px before desktop;
- no production merge until explicitly requested.
