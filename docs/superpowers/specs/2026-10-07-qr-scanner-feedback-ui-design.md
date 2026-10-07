# QR scanner feedback UI — design spec

Date: 2026-10-07 · Branch: `feat/qr-scanner-feedback-ui`

Reference: WhatsApp's QR linking scanner shared by Santiago in chat on 2026-10-07.

## Problem

The current admin scanner works, but its information hierarchy is split into three separate areas: camera, result/status below the camera, and a permanently visible manual code form. During event check-in, staff must keep looking away from the camera to understand whether the QR was detected, whether the request is still processing, and whether the runner was accepted.

The WhatsApp reference solves this better: the camera is the main surface and the current state is shown directly over it. The user always knows what the camera is doing without losing visual context.

## Decision

Redesign the shared QR scan station around a single camera surface with an in-camera status layer.

### Structure

At phone width the check-in screen reads top to bottom:

1. **Title:** “Escanea el código QR”.
2. **Helper:** “Apunta la cámara al QR del pase del corredor.”
3. **Camera surface:** large, edge-to-edge inside the content column, dark while loading, with a clear centered scan frame.
4. **Live status inside the camera:** the current scanner/request/result state is always readable without moving the eyes away from the camera.
5. **Fallback action:** “Ingresar código manualmente”, analogous to WhatsApp's “Vincular con el número de teléfono”. The manual form expands only when requested instead of taking permanent vertical space.

The admin shell remains visible. This is not a separate full-screen route.

### Camera states

The camera layer has six explicit states:

| State | UI |
|---|---|
| Starting | `LoaderCircle` + “Iniciando cámara…” |
| Ready | scan frame + “Coloca el QR dentro del marco” |
| Detected / request pending | camera dims + `LoaderCircle` + “Validando corredor…” |
| Success | `CircleCheck` + “Check-in listo” + runner name + code/group |
| Repeated | `Clock` + “Ya hizo check-in” + time + runner name |
| Error | `CircleAlert` / `CircleX` + clear error + “Intenta de nuevo o usa el código manual” |

The existing sound and vibration feedback remains. The visual state is the primary signal; sound and vibration only reinforce it.

### Result timing

- A result replaces the ready overlay but **does not stop the camera**.
- Success/error/repeat stays visible long enough to read, then the scanner returns to “Listo para escanear” automatically.
- A new QR may replace the prior result immediately once the previous request is complete.
- The existing 1.5 s duplicate-read protection stays unchanged so a deliberate second scan can still produce “Ya hizo check-in”.

### Camera denied / unavailable

If the browser denies camera access:
- replace the camera image with a clear error panel;
- copy: “No pudimos abrir la cámara.” and “Permite el acceso en el navegador o ingresa el código manualmente.”;
- show a primary “Reintentar cámara” action when retry is technically possible;
- keep “Ingresar código manualmente” available.

No dead black rectangle.

### Manual fallback

The manual form is collapsed by default. Tapping “Ingresar código manualmente” expands:
- label “Código del corredor”;
- placeholder `SR26-00042`;
- “Registrar” button;
- a “Volver al escáner” control.

The field remains 16 px minimum to avoid iOS zoom, and controls stay at least 44×44 px.

### Shared scanner

`QrScanner` remains shared by Check-in and Dynamics. The camera frame, camera lifecycle and in-camera feedback shell are therefore consistent in both places.

Check-in can show participant details; Dynamics can show its own participation result inside the same shell.

## Visual direction

Use WhatsApp only as an **interaction hierarchy reference**, not as a visual clone.

NeoTeam keeps:
- Host Grotesk;
- `--neo-*` tokens;
- cyan brand accent;
- dark camera surface;
- current light/dark admin themes;
- existing icon vocabulary.

The scanner should feel like NeoTeam's event operations UI: fast, high contrast, calm, and readable outdoors.

### Signature

The scan frame is the one memorable element: four cyan corner guides around the center scan zone. On “Validando…”, the camera gets a dark translucent veil and the status sits in the exact center, matching the reference behavior.

No decorative animation beyond the existing spinner and feedback transition. Reduced-motion users see instant state changes.

## Accessibility

- All status changes use an `aria-live="polite"` region.
- Error states use `role="alert"`.
- Status never relies on color alone.
- Icon-only controls require `aria-label`.
- Manual fallback and retry controls are keyboard reachable.
- Camera content is not relied on as text content; every state has visible copy.

## Mobile

Primary validation is 390×844.

Requirements:
- title, helper, most of the camera and fallback action fit in the first viewport;
- result text is readable over the camera in bright/outdoor use;
- no horizontal overflow;
- manual form works with the keyboard open;
- scanner remains usable one-handed.

Also verify 768 px and desktop admin widths.

## Performance

No dependency changes. Keep the existing dynamic import of `html5-qrcode`; public pages remain unaffected.

## Security

No backend, auth, Supabase, token or QR payload changes. Check-in continues through `/api/admin` → `admin-pin`.

## Out of scope

- Changing the QR payload.
- Changing check-in business rules.
- Offline check-in.
- Full-screen native camera mode.
- Flash/torch controls.
- Zoom controls.


## Mobile refinement after real preview

The first mobile preview exposed two issues that were not visible in the static hierarchy:

- `html5-qrcode` was drawing its own `qrbox` guide while NeoTeam also drew cyan corners, producing two competing frames;
- the `4:5` camera surface consumed too much vertical space and pushed the manual fallback below the useful first viewport.

The scanner therefore uses the full video frame for detection (no library `qrbox`) and NeoTeam owns the only visible scan guide. On mobile the camera surface is square; from `md` upward it returns to `4:3`. The cyan guide is reduced to 62% of the camera width so it reads as a target instead of another container.
