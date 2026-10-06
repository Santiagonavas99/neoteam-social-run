# Dynamics admin panel — plan

Spec: [`2026-10-05-dynamics-admin-design.md`](../specs/2026-10-05-dynamics-admin-design.md) · Branch: `feat/dynamics-admin` · Order: **3 of 5** (needs `qr-scanner.tsx` from plan 2) · Needs approval: replacing "Rifas" with "Dinámicas"; migrations only if Task 0 finds the tables missing.

## Tasks

### 0. Verify the remote (Iván, read-only, no commit)

- Run the three queries in the spec and paste the results into the PR.

### 1. `chore(db): record the dynamics migrations`

- Add `supabase/migrations/20261005233028_dynamics_mvp.sql` and `20261005233800_index_dynamics_eligibility.sql`, copied from Santiago's branch.
- Run them on the remote only if Task 0 says so. Re-run the raffle copy if `raffles_without_dynamic > 0`.
- After any run, Task 0's queries show:
  - both tables;
  - 0 raffles without a dynamic.

### 2. `feat(admin): dynamics types and data hook`

- **`features/admin/types.ts`:**
  - add `DynamicType`, `DynamicStatus`, `DynamicRow`, `DynamicParticipant` and `DynamicResult`;
  - add `dynamicRows`, `winnerDetails`, `participant`, `alreadyCompleted`, `won` and `prize` to `AdminResponse`;
  - add `dynamics` to `Metrics`.
- **`features/admin/labels.ts`:**
  - `dynamicStates`;
  - `dynamicTypes` (all nine, in Spanish: "Sorteo", "Stand", "Checkpoint", "Reto", "Trivia", "Misión", "Votación", "Premio instantáneo", "Puntos");
  - `dynamicFormTypes`, the five offered in the form.
- **`features/admin/dynamics/use-dynamics.ts`:**
  - list, save, delete, complete and draw on `dynamicData`;
  - the same stale-response guard as `useRecords`.
- **`features/admin/dynamics/probability.ts`:** `percentToProbability` and `probabilityToPercent`, clamped to 0..100 and 0..1.
- **`features/admin/dynamics/probability.test.ts`:** the round trip, clamping, and `NaN` → 0.
- **Check:** `pnpm test`.

### 3. `feat(admin): dynamics panel`

- **`features/admin/dynamics/dynamics-view.tsx`:**
  - the `ListToolbar` (search, type filter, "Crear dinámica"), `RecordCard` per dynamic and `EmptyState`;
  - per card: participations and winners count, `StatusBadge`;
  - actions:
    - "Editar";
    - "Registrar participación" when open and not a raffle;
    - "Sortear" (`Dices`) when it is an open raffle.
- **`features/admin/dynamics/dynamic-form.tsx`:**
  - `EditorForm` with the fields from Santiago's editor;
  - the type select offers `dynamicFormTypes`, plus the row's own type if it is a hidden one;
  - prize and number of winners shown for raffle and instant-win; eligibility only for raffle; probability only for instant-win.
- **`features/admin/dynamics/participation-panel.tsx`:**
  - `QrScanner` plus the manual code field;
  - it calls `complete` and shows each result line (spec decision 4);
  - "Cerrar" stops the camera.
- **`features/admin/dynamics/draw-result.tsx`:** the winners list after `draw` (name at 18 px or more, code, group).
- **Checks:**
  - **390×844 first** (Playwright with mocked `dynamicData`): empty, list, editor for each of the five types, the participation panel with each result, draw confirm and winners; then 1440;
  - keyboard pass;
  - `pnpm ci:check`.

### 4. `feat(admin): Dinámicas replaces Rifas`

- **`features/admin/sections.ts`:** `dynamics` replaces `raffles`: label "Dinámicas", `Zap`, description "Stands, retos, premios instantáneos y sorteos.", quick access "Stands, retos y sorteos".
- **`features/admin/admin-app.tsx`:** render `DynamicsView`.
- **`features/admin/overview/overview-view.tsx`:** the metric becomes "Dinámicas".
- **Delete:**
  - `features/admin/raffles/*`;
  - the `Raffle` type and `raffleStates`, once no other file imports them (check with `grep`);
  - the raffle legacy CSS no longer used (check each class with `grep` before deleting).
- **`DESIGN.md`:** in the icon vocabulary, `Zap` = Dinámicas, and the admin sections row swaps `Gift` (raffles) for `Zap`.
- **`CHANGELOG.md`:**
  - Added: "Panel de **Dinámicas**: stands, checkpoints, retos, premios instantáneos y sorteos, registrando a cada corredor con su QR.";
  - Changed: "Las rifas ahora se gestionan dentro de Dinámicas.".
- **Checks:**
  - 390 then 1440 screenshots of the overview and the nav;
  - a draw on a migrated raffle in a Vercel preview against the real data. Iván picks a test raffle with no real winners yet, or skips this check.
  - `pnpm ci:check`.

### 5. Clean up (Iván)

- Close Santiago's `feat/dynamics-mvp` PR with a link to this one.

## Done when

- `pnpm ci:check` passes.
- The 390 and 1440 screenshots are reviewed.
- The stand flow is tried on a real phone.
- The branch stays local until Iván says to push it.
