# Plan — QR scanner feedback UI

Spec: `docs/superpowers/specs/2026-10-07-qr-scanner-feedback-ui-design.md`

Branch: `feat/qr-scanner-feedback-ui`

Status: **approved 2026-10-07**.

Release: next minor version after the currently open releases; expected `0.23.0` if PR #45 lands first.

## Tasks

### 1. `feat(admin): add scanner lifecycle UI`

Files:
- `features/admin/ui/qr-scanner.tsx`
- `features/admin/ui/scan-station.tsx`

Changes:
- expose camera lifecycle states needed by the scan station;
- add a NeoTeam scan frame over the camera;
- move pending/result feedback into the camera surface;
- keep the camera alive while request/result feedback is visible;
- add automatic return to the ready state;
- add camera-unavailable UI with retry support where possible.

Checks:
- 390×844 first: starting, ready, validating, success, repeat, error, denied-camera;
- dark and light admin themes;
- duplicate-read window remains 1.5 s;
- scanner stops on unmount.

### 2. `feat(admin): make manual code a deliberate fallback`

Files:
- `features/admin/ui/scan-station.tsx`

Changes:
- collapse manual entry by default;
- add “Ingresar código manualmente” below the camera;
- expanded form keeps the current SR26 code path and validation;
- add “Volver al escáner”.

Checks:
- 390 px with keyboard open;
- 44 px minimum touch targets;
- 16 px input font;
- keyboard/focus traversal.

### 3. `refactor(admin): keep Check-in and Dynamics consistent`

Files:
- `features/admin/checkin/checkin-view.tsx`
- `features/admin/dynamics/participation-panel.tsx` if needed
- `DESIGN.md`

Changes:
- add the check-in title/helper around the scan station where appropriate;
- ensure Dynamics reuses the same scanner feedback shell without check-in-specific copy leaking into it;
- document the scanner state hierarchy and scan-frame treatment in `DESIGN.md`.

Checks:
- Check-in result details: runner name, code, group and repeat time;
- Dynamics result details remain correct;
- existing sound/vibration feedback still matches success/repeat/error.

### 4. `test(admin): scanner feedback states`

Files:
- scanner/scan station tests or existing Playwright coverage, whichever the repo already uses for admin UI;
- no new test dependency.

Cases:
- camera permission denied;
- validating state while request is pending;
- success;
- already checked in;
- invalid QR/network error;
- second scan after 1.5 s reaches the server.

Checks:
- `pnpm ci:check`;
- real iPhone Safari preview test;
- real Android Chrome preview test.

### 5. `chore(release): next minor`

Files:
- `CHANGELOG.md`
- `package.json`

Release note:
- “El escáner QR del panel ahora muestra claramente cuándo está buscando, validando y registrando, con los resultados directamente sobre la cámara y el código manual como alternativa.”

Final checks:
- CI fully green;
- Vercel preview `READY`;
- no production deploy until explicitly requested.


### Mobile refinement from preview review

After Santiago reviewed the first mobile preview:
- remove `html5-qrcode`'s `qrbox` so only the cyan NeoTeam guide is visible;
- change the phone camera surface from `4:5` to square;
- reduce the visual guide to 62% width;
- slightly tighten mobile spacing so the manual fallback remains discoverable above the bottom navigation.
