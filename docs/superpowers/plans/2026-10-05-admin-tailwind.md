# Cyan palette, admin layout and Tailwind, theme — plan

**Specs:**
- [`2026-10-05-cyan-palette-admin-layout-design.md`](../specs/2026-10-05-cyan-palette-admin-layout-design.md) (palette, navigation, participants, overview), approved;
- [`2026-10-05-tailwind-and-icons-design.md`](../specs/2026-10-05-tailwind-and-icons-design.md), decisions 5 (Phase A) and 8 (theme), approved.

Tasks 4, 4b and 5 of [`ok-2026-10-05-tailwind-and-icons.md`](ok-2026-10-05-tailwind-and-icons.md).

**Branch:** `refactor/admin-tailwind` (rebased on `main` v0.7.0) · **Status:** awaiting OK.

## Freeze and order

- Anything not merged by **15 Oct** waits until after the event (18 Oct).
- Tasks go in the order below. The first four are the day-of-event wins, and each can be merged on its own if time runs out.
- Check-in and Dinámicas are already Tailwind (plans 2 and 3); they only pick up the new tokens.

## Tasks

### 1. `fix(ui): accent text contrast` (old 4c)

- `features/registration/form-ui.tsx:103`: step numbers go from `text-neo-accent` to `text-neo-accent-text`.
- Every `text-neo-accent-dark` used as text becomes `text-neo-accent-text`:
  - `overview-view.tsx`;
  - `draw-result.tsx` (twice);
  - `scan-station.tsx`;
  - `registration-shell.tsx` (twice);
  - `form-ui.tsx:154`.
- **Check:** every element listed is at least 4.5:1 at 390 px, in light mode and in forced dark mode.

### 2. `refactor(ui): cyan palette tokens` (old 4.0)

- **`app/globals.css`:**
  - the `:root` and `[data-theme="dark"]` values from the spec's study table;
  - the new tokens (`border-strong`, `muted-bg`, `warning`/`warning-bg`, `on-dark-secondary`/`-border`/`-hover`);
  - `--neo-success-bg: var(--neo-accent-soft)`.
- **`app/tailwind.css`:** the new tokens in `@theme inline`.
- **The 39 hard-coded colors** in `globals.css` and `neo-overrides.css` go to tokens, using the mapping table of the previous plan version (git history), with two corrections:
  - neutral badge and table head → `muted-bg`;
  - completed badge → `accent-soft` / `accent-text`.
- **`DESIGN.md`:**
  - the token and contrast tables, the dark table included;
  - the rule "accent as text is `--neo-accent-text`";
  - the rule "no raw hex outside the token blocks";
  - Known debt: only the 31 colors left in `home-v2.css`.
- **Checks:**
  - `rg` finds no hex in `neo-overrides.css`, and none in `globals.css` outside the token blocks;
  - screenshots at 390 px, then 1440, of `/`, `/registro`, `/pase` and every admin section, against `main`. Iván reviews the expected tint change.

### 3. `feat(admin): navigation by moment` (spec decisions 5 and 6, in Tailwind)

- **`features/admin/sections.ts`:**
  - `group: 'event' | 'content' | 'account'` and `primary?: true` (Check-in, Participantes, Dinámicas);
  - `quickAccess` is deleted.
- **`features/admin/shell/admin-shell.tsx`:**
  - **phones:** a fixed bottom tab bar (3 primary sections plus "Más"), at least 56 px tall, with bottom safe-area padding; the active tab gets an `aria-current` and a cyan top bar;
  - **"Más":** a sheet listing the other sections, then "Ver página", the theme switch slot and "Cerrar sesión";
  - **from `md`:** the black sidebar with the three groups.
- **Compact section header:** 24 px title on phones, 34 px from `md`, and one line of description.
- Shell rules are deleted from `globals.css` and `neo-overrides.css` after a `grep` for each class.
- **Checks:**
  - 390 px: all 8 sections are reachable in at most two taps;
  - no horizontal scroll;
  - the tab bar does not cover the last row of content (bottom padding);
  - keyboard: tab order follows the visual order, and the sheet closes with Escape and returns focus;
  - then 1440.

### 4. `feat(admin): participants as rows` (spec decision 7)

- **`features/admin/participants/participants-view.tsx`:**
  - one row per runner in a `<details>`, at least 64 px tall;
  - the open row shows contact, size, the status select, Check-in, and "Eliminar" as `text-link danger-text`;
  - status filter chips with counts, computed from the loaded rows;
  - icon-only refresh with `aria-label="Actualizar"`.
- **Checks:**
  - 390 px: 5 runners fit in the first screen under the header;
  - Check-in and status changes still work, and delete still asks for confirmation (browser test with mocked `/api/admin`).

### 5. `feat(admin): overview leads with check-in` (spec decision 8)

- **`features/admin/overview/overview-view.tsx`:**
  - check-in progress card on black, with a cyan bar (`role="progressbar"` and `aria-valuenow`/`aria-valuemax`);
  - smaller metrics after it;
  - active dynamics listed below (from the existing `dynamicData` list);
  - the quick-access list is deleted.
- **Check:** 390 px, then 1440.

### 6. `refactor(admin): remaining screens to Tailwind` (old 4.1–4.3 and 4.5, one commit each)

- `features/admin/ui/*`: Feedback, StatusBadge, toolbar, record card, editor form, upload field, empty and loading states, confirm panel.
- `features/admin/community/*`, `features/admin/logos/*`, `features/admin/auth/*`, `features/admin/security/*`.
- The legacy rules of each moved component are deleted after a `grep`.
- **Checks per commit:**
  - 390 px, then 1440;
  - targets of at least 44 px;
  - keyboard pass.

### 7. `feat(admin): light, dark and system theme` (old 4b)

- `lib/theme.ts` and its test.
- `app/admin/layout.tsx`: the theme root, with an inline script before paint.
- `features/admin/shell/theme-switch.tsx`: "Claro · Oscuro · Sistema" with `Sun` / `Moon` / `Monitor`, as 44 px options.
- Placement: in the "Más" sheet on phones, and in the "Cuenta" group of the sidebar.
- **Checks:**
  - every admin section at 390 px in dark mode, with contrast checked against the `DESIGN.md` dark table;
  - Check-in in dark mode: the result card stays readable, and the camera view has no white flash.

### 8. `docs(design): Phase A status`

- **`DESIGN.md`:**
  - the admin is Tailwind;
  - the public pages stay legacy until Phase B;
  - Known debt is updated;
  - the icon vocabulary gains `Ellipsis` = "Más" and `Sun`/`Moon`/`Monitor` = theme.
- In the PR, the `wc -l` of `app/*.css` before and after.
- Mark Tasks 4, 4b and 5 done in `ok-2026-10-05-tailwind-and-icons.md`.

### 9. `chore(release): 0.8.0`

- `package.json` goes to 0.8.0.
- `CHANGELOG.md` gains `## [0.8.0] - <date>`:
  - **Changed:** cyan palette with readable contrast, bottom navigation on phones, participants as rows, overview leads with check-in;
  - **Added:** light, dark and system theme in the admin.

## Done when

- `pnpm ci:check` passes after every task.
- Each task has its screenshots at 390 px first, then 1440.
- The branch stays local until Iván says to push it.
