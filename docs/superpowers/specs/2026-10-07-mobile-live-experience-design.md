# Mobile live experience — design spec

Date: 2026-10-07 · Branch: `feat/mobile-live-experience`

## Thesis

At 390 px, Social Run should feel less like a static event landing page and more like a **live race-day interface**.

The signature is not “more animations everywhere”. It is a consistent motion language inspired by timing, pace and checkpoints:

- **pulse** = something is live/current;
- **tick** = time/status changed;
- **slide** = the user advances;
- **sweep** = the user arrives at a section.

Motion answers state changes and navigation. Decorative ambient motion stays secondary.

Primary target: 390 px. Desktop must remain polished but mobile drives the decisions.

This supersedes the narrower `feat/active-home-nav` design direction; that branch contains documentation only and no implementation.

---

## 1. Mobile Agenda becomes contextual

### Current problem

The agenda is readable, but every item has almost the same hierarchy. On event day the user must scan the full timeline to answer:
- what is happening now?
- what is next?
- what time is it?

### New mobile hierarchy

At the top of Agenda, before the full timeline, add a compact **live agenda card**.

Before event day:

```
PRIMERO · 7:30 A. M.
Llegada y bienvenida
18 OCT · PARQUE DEL INGENIO
```

On 18 October before 07:30:

```
HOY · EMPIEZA 7:30 A. M.
Llegada y bienvenida
```

During the event:

```
AHORA · 7:50 A. M.
Ruta 5K

SIGUE · 8:30 A. M.
Regreso
```

After the last agenda item / event end:

```
CERRAMOS JUNTOS
Cierre y fotografías
Gracias por correr con NeoTeam.
```

### Time logic

Use the existing ISO event timestamps and agenda data.

Agenda items gain machine-readable timestamps rather than parsing display copy such as `7:30` / `a. m.`.

The current item is the latest item whose start time is <= now and before the next item.

The next item is the immediately following item.

The component updates on the client at minute-level granularity; no second-by-second countdown is needed.

### Timeline treatment

On mobile:
- current item's dot becomes cyan and emits one restrained pulse/ring;
- current title has high emphasis;
- next item gets a small `SIGUE` eyebrow;
- past items reduce slightly in emphasis but remain fully readable;
- future items remain normal;
- timeline accent fill progresses to the current item.

On desktop, preserve the editorial two-column composition; the contextual card may appear above the timeline column without overpowering the headline.

### Motion

- when current agenda state changes, the live card content uses a short vertical tick transition;
- current dot gets a slow pulse only while the event is actively running;
- timeline accent fill transitions to the current checkpoint;
- no continuous glowing/shimmering text.

Reduced motion: all state changes remain visible, transitions become instant and pulse is removed.

---

## 2. Section-arrival feedback

### Goal

When the user reaches a major editorial section, the index should acknowledge arrival without moving the whole section.

Examples:
- `01 / EL PLAN`
- `02 / AGENDA`
- `03 / COMUNIDAD`

### Motion

On first entrance into the viewport:
1. index moves up about 6–8 px into place;
2. a thin cyan sweep passes under/through the label;
3. text settles at full emphasis.

Duration around 320–420 ms.

Use the existing CSS scroll-driven animation system where supported, with static fallback.

Do not repeatedly replay while tiny scroll movements cross the boundary.

### Anchor arrival

If a user jumps to an anchor such as Agenda, the same arrival treatment should be visible when the target enters the reading zone.

No full-section flash or scale effect.

---

## 3. Registration becomes a real 3-step flow

### Goal

Replace the long mobile form with a clear, short wizard:

```
Paso 1 de 3
Tus datos  →  Crew  →  Confirmación
████░░░░░░░░
```

### Steps

**Paso 1 · Tus datos**
- nombre;
- apellido;
- documento;
- correo;
- WhatsApp;
- fecha de nacimiento;
- género.

**Paso 2 · Crew**
- running crew;
- custom crew when `Otro`;
- emergency contact name;
- emergency contact phone.

The emergency fields remain here to keep the final confirmation step short; the visible step title can be `Crew y seguridad` while the compact progress label remains `Crew`.

**Paso 3 · Confirmación**
- concise review of name, contact and crew;
- responsibility checkbox;
- privacy checkbox;
- optional marketing checkbox;
- final `Confirmar mi registro` button.

### Progress UI

At the top of the registration card:
- `Paso X de 3`;
- three short progress segments;
- labels `Tus datos · Crew · Confirmación` on screens where they fit, otherwise current label + count.

Completed segments become cyan.

### Navigation

- primary button: `Continuar`;
- secondary/back action: `Volver`;
- final button remains `Confirmar mi registro`.

Touch targets >=44 px.

### Validation

Clicking Continue validates only the current step.

Values stay mounted/preserved in the form so the existing server action receives the same complete payload at final submit.

When server validation returns field errors:
- map fields to their owning step;
- automatically show the earliest step containing an error;
- preserve submitted values;
- focus/announce the error summary as today.

No database/RPC contract change.

### Step motion

- forward: current content exits a few pixels left, next enters from right;
- backward: inverse direction;
- 180–240 ms, transform + opacity only;
- card height transition should not cause a large jump; scroll current step heading into view when necessary.

No carousel gesture/swipe; form progression remains button-driven and predictable.

---

## 4. Micro event status in the sticky header

### Position

On mobile, place a tiny event-status badge immediately after the NeoTeam brand, before the right-side controls.

Keep it visually subordinate to the logo.

### States

Before 18 October:
`● 18 OCT`

On event day before start:
`● HOY`

During `startsAt <= now < endsAt`:
`● EN VIVO`

After the event:
`● FINALIZADO`

### Visual treatment

- 12 px minimum text;
- compact capsule / inline badge using existing dark-header tokens;
- cyan dot;
- only `EN VIVO` gets a slow breathing/pulse animation;
- no blinking.

The badge is informational, not interactive.

Desktop may show the same status at a slightly roomier size if it fits without disturbing nav balance.

---

## 5. Motion system: make the site feel alive without becoming noisy

### Motion hierarchy

**Level A — Live**
Only real-time/current state may loop:
- `EN VIVO` header dot;
- current Agenda checkpoint ring.

Maximum two looping elements visible at once.

**Level B — Arrival**
Plays once when content is reached:
- section index sweep;
- existing reveal system;
- timeline/current card entrance.

**Level C — Action**
Answers direct user input:
- registration step transition;
- button press;
- theme transition;
- success streamers.

### Additional refinements

1. Hero metadata pills receive a tiny stagger after the title load, using the existing hero sequence.
2. Agenda timeline dots enter with a light stagger on first reveal, but no bouncing.
3. Registration progress segment fills animate when advancing.
4. Success state keeps the existing streamers; do not add a second celebration.
5. Buttons may use a subtle `translateY(1px)` / compression on active press where the design system already allows it.

### Hard limits

Do not add:
- parallax;
- cursor-follow effects;
- autoplay background video;
- infinite text marquees beyond existing logo strips;
- bouncing CTA buttons;
- large blur blobs;
- constant shimmer;
- animation that delays interaction.

---

## Accessibility

- every animation respects `prefers-reduced-motion`;
- live agenda text changes use a polite live region, not assertive announcements;
- event status does not rely on the cyan dot alone;
- wizard progress has textual `Paso X de 3`;
- hidden registration steps must not trap focus;
- focus moves intentionally when steps change or server errors return;
- contrast remains within existing tokens.

---

## Performance

- no new animation library;
- CSS transitions / scroll-driven animation first;
- one minute-level timer for live event state;
- no scroll event listeners;
- use `IntersectionObserver` only where CSS cannot express state;
- no layout-heavy animation properties.

---

## Release

This is a substantial public UX feature and should ship as **v0.28.0** if `main` remains at `0.27.0`.

---

## Acceptance at 390 px

- sticky header stays one clean row;
- event status is readable without squeezing the CTA/theme controls;
- Agenda immediately communicates current/next state;
- no horizontal overflow in agenda or registration;
- registration shows one logical step at a time;
- user can move back without losing values;
- section-index motion is visible but does not shift content;
- reduced-motion mode has no looping/arrival animations;
- form success and pass flow remain unchanged.
