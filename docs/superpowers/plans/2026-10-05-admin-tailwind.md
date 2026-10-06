# Admin panel to Tailwind, theme, close Phase A — plan

Spec: [`2026-10-05-tailwind-and-icons-design.md`](../specs/2026-10-05-tailwind-and-icons-design.md), approved; decisions 5 (Phase A) and 8 (theme). Tasks 4, 4b and 5 of [`ok-2026-10-05-tailwind-and-icons.md`](ok-2026-10-05-tailwind-and-icons.md), split out on their own branch and updated for plans 2 and 3.

Branch: `refactor/admin-tailwind` (from `main` after `feat/dynamics-admin`) · Order: **5 of 5** · Status: **awaiting OK**. Plans 1–4 needed a new spec; this one re-uses the approved spec, so only this updated plan needs an OK.

## What changed since the approved plan

- **Check-in (plan 2) and Dinámicas (plan 3) are built in Tailwind from the start**, so they leave Task 4. They still get the theme in Task 4b.
- **Rifas is deleted by plan 3**, so `features/admin/raffles/*` leaves Task 4.
- **A freeze before the event.**
  - This refactor changes no behavior, but it touches every admin screen staff use on 18 Oct.
  - Anything not merged by **15 Oct** waits until after the event.
  - Task 4b (theme) can ship alone, because it only works on surfaces that are already on tokens.
  - Recommended order if time is short: 4.1, then Task 4b, and leave the rest for after.

## Tasks

### 4. `refactor(admin): <area> to Tailwind` (one commit per item)

Mobile first: unprefixed utilities are the 390 px design, and `md:`/`lg:` add desktop. Legacy `max-width` queries are inverted.

In each commit, the moved markup's rules are deleted from `app/globals.css` and `app/neo-overrides.css`. Check each class name with `grep` first, so a rule the public site still uses is not deleted.

- [ ] 4.1 `features/admin/ui/*`: Feedback, StatusBadge, Logo, toolbar, record card, editor form, upload field, empty and loading states, confirm panel.
  - These carry most of the screens, including Check-in and Dinámicas, which already use them.
- [ ] 4.2 `features/admin/community/*`
- [ ] 4.3 `features/admin/logos/*`
- [ ] 4.4 `features/admin/overview/*`, `features/admin/participants/*`
- [ ] 4.5 `features/admin/shell/*`, `features/admin/auth/*`, `features/admin/security/*`

**Checks per commit:**
- screenshots at **390 px first**, then 1440, against `main` (`scratchpad/pw/shots.cjs`, extended with the Check-in and Dinámicas sections);
- no horizontal page scroll, targets of at least 44 px;
- keyboard pass;
- `pnpm ci:check`.

### 4b. `feat(admin): light, dark and system theme`

Unchanged from the approved plan:
- `lib/theme.ts` and its test;
- `app/admin/layout.tsx`, with the theme root and an inline script before paint;
- `features/admin/shell/theme-switch.tsx`: "Claro · Oscuro · Sistema", with `Sun` / `Moon` / `Monitor` and 44 px options;
- placed in the sidebar (the top bar on phones).

**Added check:**
- Check-in in dark mode at 390 px: the scan result card stays readable (contrast checked against the `DESIGN.md` dark table);
- the camera view has no white flash.

### 5. `docs(design): Phase A status`

- **`DESIGN.md`:**
  - the admin is Tailwind; the public pages stay legacy until Phase B (after 18 Oct);
  - remove the Known-debt items that Phase A fixed.
- In the PR description, the line counts of `app/*.css` before and after (`wc -l`).
- Mark Tasks 4, 4b and 5 done in `ok-2026-10-05-tailwind-and-icons.md`.

## Done when

- `pnpm ci:check` passes.
- The screenshots show no visual difference in light mode.
- The branch stays local until Iván says to push it.
