# Tailwind CSS and icon system — plan (Phase A)

Spec: `docs/superpowers/specs/2026-10-05-tailwind-and-icons-design.md`. Branch: `feat/tailwind-and-icons`, cut from `main` after `chore/professionalize-tooling` merges. Status: **awaiting OK**.

One commit per task. Every task ends with `pnpm ci:check` green. Phase B (public pages, legacy CSS removal, preflight) gets its own plan after 18 Oct.

---

## Task 0 — Baseline screenshots

- [ ] Screenshots of `/`, `/registro` and every admin section (`metrics`, `logos`, `participants`, `groups`, `brands`, `raffles`, `security`) at 1440 px and 390 px, saved under `design/baseline/2026-10-05/`.
- No commit of code; commit the screenshots: `docs(design): baseline screenshots before Tailwind`

## Task 1 — Install Tailwind 4 without preflight

- [ ] `pnpm add -D tailwindcss@^4.3.3 @tailwindcss/postcss@^4.3.3`
- [ ] `postcss.config.mjs`: `{ plugins: { '@tailwindcss/postcss': {} } }`
- [ ] `app/tailwind.css`:
  ```css
  @layer theme, utilities;
  @import "tailwindcss/theme.css" layer(theme);
  @import "tailwindcss/utilities.css" layer(utilities);
  @source "../app";
  @source "../components";
  ```
- [ ] `app/layout.tsx`: import `./tailwind.css` **first**, before `globals.css`.
- [ ] `biome.json`: `css.parser.tailwindDirectives: true`.
- Check: `pnpm build`; screenshots of `/` and `/admin` identical to Task 0 (no preflight → no base-style change).
- Commit: `feat(styles): add Tailwind 4 alongside legacy CSS`

## Task 2 — Bridge the design tokens

- [ ] `app/tailwind.css`: `@theme inline` mapping every `:root` token in `app/globals.css`:
  - colors `--color-neo-{accent,accent-dark,bg,black,border,danger,danger-bg,success-bg,surface,text-secondary,white}: var(--neo-…)`
  - `--spacing: 0.25rem` stays Tailwind's default; named steps `--spacing-1…24` only if values differ from Tailwind's scale (verify against `--space-*`).
  - `--radius-card: var(--radius-card)`, `--radius-control: var(--radius-control)`
  - `--font-sans: var(--font-host-grotesk), system-ui, sans-serif`
- [ ] `DESIGN.md` (from the tooling plan): add a "Tailwind" section with the token ↔ utility table.
- Check: a throwaway `bg-neo-accent rounded-card` element renders with the legacy values (then removed); `pnpm build`.
- Commit: `feat(styles): expose design tokens as Tailwind theme`

## Task 3 — Lucide icons everywhere

- [ ] `pnpm add lucide-react@^1.52.0`
- [ ] Replace the 19 glyphs (`grep -rn '[←→↗✓↓]' app components`): `→` `ArrowRight`, `←` `ArrowLeft`, `↗` `ArrowUpRight`, `✓` `Check`, `↓` `ArrowDown`. Each icon `aria-hidden` and `className="size-4 shrink-0"` (or the size the glyph had), inline with text via `inline-flex items-center gap-1` on the parent.
- [ ] Icon-only buttons (carousel prev/next) keep their `aria-label`.
- [ ] `DESIGN.md` standing rule: icons come from `lucide-react` only; no Unicode glyphs, no inline SVG.
- Check: `grep -rn '[←→↗✓↓]' app components` → no matches in JSX; screenshots vs baseline (arrows now aligned; nothing else moved).
- Commit: `feat(ui): lucide-react icon system`

## Task 4 — Admin panel to Tailwind (one commit per file)

For each file, move its markup to utilities and **delete the same rules from the legacy CSS** in the same commit (the admin rules live in `app/globals.css` and `app/neo-overrides.css`; `grep` each class name before deleting to be sure the public site does not use it).

- [ ] 4a `app/admin/admin-ui.tsx` (Feedback, StatusBadge, Logo)
- [ ] 4b `app/admin/record-editor.tsx`
- [ ] 4c `app/admin/logo-carousel-admin.tsx`
- [ ] 4d `app/admin/admin-management.tsx`
- [ ] 4e `app/admin/admin-dashboard.tsx` (shell, sidebar, login, security)
- Check per commit: screenshots of the affected admin sections at 1440/390 vs baseline; keyboard pass (tab order, visible focus); `pnpm ci:check`.
- Commits: `refactor(admin): <file> to Tailwind`

## Task 5 — Close Phase A

- [ ] `DESIGN.md`: mark which surfaces are Tailwind (admin) and which are legacy (public) until Phase B.
- [ ] Measure: lines removed from the legacy CSS (`wc -l app/*.css` before/after) in the PR description.
- Commit: `docs(design): Phase A status`

---

## After this plan (Iván)

- Review the admin screenshots against the baseline and approve the PR.
- After 18 Oct: approve the Phase B plan (public pages, delete legacy CSS, enable preflight).
