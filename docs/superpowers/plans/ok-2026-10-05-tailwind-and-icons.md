# Tailwind CSS and icon system — plan (Phase A)

Spec: `docs/superpowers/specs/2026-10-05-tailwind-and-icons-design.md`. Branch: `feat/tailwind-and-icons`, cut from `main`. Status: **approved 2026-10-05 (changes approved the same day). Done on `feat/tailwind-and-icons`: 0 `b60a4a0` (public; admin baseline pending Iván), 1 `6fd8e74`, 2 `e63edf2`, 3 `3b5b1f2` + `3ed89b5`, 3b `3f2dc9b`. Done on `refactor/admin-tailwind` (plan `ok-2026-10-05-admin-tailwind.md`): 4, 4b, 5. Original changes: Task 3 rewritten (icon review of every screen), dark tokens added to Task 2, new Task 4b (theme), new Task 3b (countdown)**.

One commit per task. Every task ends with `pnpm ci:check` green. Phase B (public pages, legacy CSS removal, preflight) gets its own plan after 18 Oct.

**Order agreed with Iván (2026-10-05):** this branch ships Tasks 0–3b (setup, tokens, icons, countdown) so the new screens of `feat/qr-checkin` and `feat/dynamics-admin` are built with Tailwind and Lucide from the start. Tasks 4, 4b and 5 (moving the existing admin to Tailwind, then the theme) run on a follow-up branch `refactor/admin-tailwind` after those two, from this same plan.

---

## Task 0 — Baseline screenshots

- [ ] Public pages: headless Chrome against the production site (no local server), `/` and `/registro` at **390×844** first, then 1440×900, saved under `design/baseline/2026-10-05/` as `<route>-<width>.png`.
- [ ] **(Iván)** Admin sections (`metrics`, `logos`, `participants`, `groups`, `brands`, `raffles`, `security`) and the login screen: screenshots from his phone (390 px) and laptop, because the panel needs the PIN. Test records only, no real participant data (`design/README.md`).
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
- [ ] Dark values for every color token under `[data-theme="dark"]` in `app/globals.css` (palette in spec decision 8), plus `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` in `app/tailwind.css`. Inert in this branch: nothing sets `data-theme` yet.
- [ ] Contrast check of each dark text/background pair (WCAG AA ≥ 4.5:1 for text, ≥ 3:1 for large text and UI borders), results recorded in `DESIGN.md`.
- Check: a throwaway `bg-neo-accent rounded-card` element renders with the legacy values (then removed); `pnpm build`.
- Commit: `feat(styles): expose design tokens as Tailwind theme`

## Task 3 — Icon system: review of every screen

- [ ] `pnpm add lucide-react@^1.52.0` (client cost: only imported icons ship, ~0.3–0.6 KB gzip each; about 30 distinct icons).
- [ ] Apply the inventory below. Each icon: `aria-hidden`, `className="size-4 shrink-0"` unless the table says otherwise, parent gets `inline-flex items-center gap-2` when it is not already flex. Text stays; icons sit before the text for state/object, after it for direction (`ArrowRight`, `ArrowUpRight`, `ChevronRight`).
- [ ] `DESIGN.md`: replace standing rule 6 with the icon rules and the vocabulary table (icon → meaning) from spec decision 4.

### Public

| Where | Today | Icon |
|-------|-------|------|
| `app/page.tsx` hero CTA "Quiero participar" | `↗` | `ArrowRight` (internal link) |
| `app/page.tsx` "Ver agenda" | `↓` | `ArrowDown` |
| `app/page.tsx` meta pills "18 OCT · 2026" / "07:30 A. M." / "5K SOCIAL" | text | `CalendarDays` / `Clock` / `Route` before the text |
| `app/page.tsx` route card "Parque del Ingenio…" | text | `MapPin` before the place |
| `app/page.tsx` raffle block "DESPUÉS DE LA RUTA" | text | `Gift` before the label |
| `app/page.tsx` raffle "Registrarme", final "Quiero estar ahí" | `↗` | `ArrowRight` |
| `components/horizontal-carousel.tsx` prev / next | `←` `→` | `ChevronLeft` / `ChevronRight` (`size-5`, `aria-label` kept, 44 px target) |
| `app/registro/page.tsx` "Volver al evento" | `←` | `ArrowLeft` |
| `app/registro/page.tsx` facts FECHA / PUNTO / FORMATO | text | `CalendarDays` / `MapPin` / `Users` |
| `app/registro/registration-form.tsx` submit "Confirmar mi registro" | `↗` | `ArrowRight`; while pending, `LoaderCircle` (`motion-safe:animate-spin`) replaces it |
| `registration-form.tsx` field errors | text | `CircleAlert` (`size-3.5`) before the message |
| `registration-form.tsx` form message (error) | text | `CircleAlert` |
| `registration-form.tsx` success mark | `✓` | `CircleCheck` (`size-8`) |

No icons on: the site header nav, the footer, the hero title, the big numbers (`v2-fact`), the agenda cards (their `01–07` is a real timeline), the form section numbers (`01–03`, real steps), the logo carousels.

### Admin

| Where | Today | Icon |
|-------|-------|------|
| Login "Entrar" / setup "Guardar PIN y entrar" | `→` / — | `LogIn` |
| Login / setup "Volver al evento" | `←` | `ArrowLeft` |
| Loading "Comprobando acceso…", "Cargando…" states | text / `loading-line` | `LoaderCircle` (`motion-safe:animate-spin`) |
| Sidebar nav numbers `01…07` | numbers | section icons, `size-5`: Overview `LayoutDashboard`, Carrusel logos `GalleryHorizontal`, Participantes `Users`, Grupos `Flag`, Marcas `Tag`, Rifas `Gift`, Seguridad `ShieldCheck` |
| Sidebar "Cerrar sesión" | `↗` | `LogOut` |
| Topbar "Ver página" (`target="_blank"`) | `↗` | `ArrowUpRight` (only true new-tab link) |
| `Feedback` (`admin-ui.tsx`) success / error | text | `CircleCheck` / `CircleAlert` |
| `StatusBadge` participant: Inscrito / Check-in / No asistió / Cancelado | color | `Circle` / `CircleCheck` / `CircleSlash` / `CircleX` (`size-3.5`) |
| `StatusBadge` raffle: Borrador / Abierta / Sorteada / Cancelada | color | `CircleDashed` / `CircleDot` / `Trophy` / `CircleX` |
| `StatusBadge` active·inactive, visible·oculto | color | `Eye` / `EyeOff` |
| Toolbar "Actualizar" (management, logos) | `↻` | `RefreshCw`, spinning while loading (`motion-safe`) |
| Toolbar "Añadir marca / grupo / Crear rifa / Añadir logo" | `+` | `Plus` |
| Search field | — | `Search` inside the field (left, `pointer-events-none`) |
| Empty state `00` | number | the section's nav icon (`size-8`); with filters active, `SearchX` |
| "Limpiar filtros" | — | `X` |
| Metric cards index `01…05` | numbers | Inscritos `Users`, Check-in `UserCheck`, Grupos `Flag`, Marcas `Tag`, Rifas `Gift` (`size-5`) |
| Quick access items | `↗` | the section icon before, `ChevronRight` after (internal navigation) |
| Participants "Check-in" | `✓` | `UserCheck` |
| Participants / logos "Eliminar", "Sí, eliminar", "Confirmar eliminar", editor "Eliminar" | text | `Trash2` |
| Confirmation panel title, delete / draw | text | `TriangleAlert` / `Dices` |
| Raffle "Sortear", "Confirmar y sortear" | `→` / — | `Dices` |
| Record and logo "Editar" | text | `Pencil` |
| Editor "Guardar cambios" / "Guardar logo" | text | `Check` |
| Upload field "Añadir imagen" / "Cambiar imagen" | text | `ImagePlus` / `ImageUp` |
| Logo row link (`link_url`) | text | `Link` (`size-3.5`) |
| Security "Cambiar PIN" heading, "Actualizar PIN" button | text | `KeyRound` |

No icons on: "Cancelar" buttons (text is enough next to an iconed primary action), table headers, form labels, the `N` brand mark.

### Checks

- `grep -rnE '[←→↗↘↓✓↻]' app components` → no matches in JSX; no `+ ` prefixes left in button text.
- Every icon-only control has an `aria-label`; every other icon has `aria-hidden` (`grep -c aria-hidden` per file vs icon imports).
- **390 px first**: home, registro (form, an error, success) and every admin section; icons aligned with their text, no wrapping inside buttons, carousel and nav targets ≥ 44 px. Then 1440 px. Compared with the Task 0 baseline: icons are the only change.
- macOS "Reduce motion" on: spinners do not spin.
- `pnpm ci:check` green; `pnpm build` client bundle size for `/` and `/admin` noted in the PR (before/after).
- Commits (two, for review): `feat(ui): lucide icon system on public pages`, `feat(admin): lucide icons across the panel`.

## Task 3b — Event countdown on the home

Spec: `docs/superpowers/specs/2026-10-05-event-countdown-design.md`. Needs Tasks 1–2.

- [ ] `lib/event.ts`: `startsAt: '2026-10-18T07:30:00-05:00'`, `endsAt: '2026-10-18T11:00:00-05:00'`.
- [ ] `lib/countdown.ts` + `lib/countdown.test.ts`: `countdown(nowMs, startMs, endMs)`; tests: 1 s before start, exactly at start (`live`), 1 s before end, exactly at end (`ended`), a value with days, hours, minutes and seconds all non-zero.
- [ ] `components/event-countdown.tsx` (client): server values as initial state, 1 s interval, cleared on unmount; digits `aria-hidden` + `tabular-nums` + `suppressHydrationWarning`; visually hidden sentence; `live` state with `motion-safe:animate-pulse` dot; `ended` → `null`.
- [ ] `app/page.tsx`: render it in `.v2-hero-side` between the headline and `.v2-hero-actions`.
- Check: **390×844 first** (headless Chrome on the preview): clock and CTA visible without scrolling, one line, no overflow at 360 px; then 1440. Reduced motion: no pulse. Fake clock in the test covers the three states; a manual check of `live` by temporarily passing a past `startsAt` in dev (not committed). `pnpm ci:check`.
- Commit: `feat(home): countdown to the event`

## Task 4 — Admin panel to Tailwind (one commit per file)

Mobile first: unprefixed utilities = 390 px, `md:`/`lg:` for desktop; `max-width` legacy queries are inverted. For each file, move its markup to utilities and **delete the same rules from the legacy CSS** in the same commit (the admin rules live in `app/globals.css` and `app/neo-overrides.css`; `grep` each class name before deleting to be sure the public site does not use it).

Files renamed by `refactor/feature-structure` (2026-10-05); the list below uses the new paths.

- [ ] 4a `features/admin/ui/*` (Feedback, StatusBadge, Logo and the shared blocks: toolbar, record card, editor form, upload field, empty/loading states, confirm panel)
- [ ] 4b `features/admin/community/*`, `features/admin/raffles/*` (forms and lists)
- [ ] 4c `features/admin/logos/*`
- [ ] 4d `features/admin/overview/*`, `features/admin/participants/*`
- [ ] 4e `features/admin/shell/*`, `features/admin/auth/*`, `features/admin/security/*`
- Check per commit: screenshots at **390 px first**, then 1440, vs baseline; tables/lists usable on a phone (no horizontal page scroll, 44 px targets); keyboard pass (tab order, visible focus); `pnpm ci:check`.
- Commits: `refactor(admin): <file> to Tailwind`

## Task 4b — Light / dark / system theme (admin and new screens)

On `refactor/admin-tailwind`, after Task 4e, when the whole admin is on tokens.

- [ ] `lib/theme.ts`: `type ThemeChoice = 'light' | 'dark' | 'system'`, `resolveTheme(choice, prefersDark)`, the storage key `neoteam-theme`; plus `lib/theme.test.ts` (resolution and invalid stored values fall back to `system`).
- [ ] `app/admin/layout.tsx`: wraps the admin in `<div id="neo-theme-root" data-theme="light">`, followed by an inline script (before paint) that reads the stored choice, resolves `system` with `matchMedia` and sets `data-theme` and `style.colorScheme`. The `/admin/checkin` and dynamics screens live under `/admin` and inherit it.
- [ ] `features/admin/shell/theme-switch.tsx` (client): a radio group "Claro · Oscuro · Sistema" with `Sun` / `Moon` / `Monitor` icons and visible labels, each option ≥ 44 px; stores the choice and, in `system`, listens to `matchMedia` changes.
- [ ] Placed in the admin sidebar under the navigation (top bar on phones).
- Check: **390 px first**, every admin section in light and dark; reload in dark shows no light flash; switching the phone to dark with "Sistema" selected updates the open panel; keyboard (arrow keys move inside the radio group, visible focus); `pnpm ci:check`.
- Commit: `feat(admin): light, dark and system theme`

## Task 5 — Close Phase A

- [ ] `DESIGN.md`: mark which surfaces are Tailwind (admin) and which are legacy (public) until Phase B.
- [ ] Measure: lines removed from the legacy CSS (`wc -l app/*.css` before/after) in the PR description.
- Commit: `docs(design): Phase A status`

---

## After this plan (Iván)

- Review the admin screenshots against the baseline and approve the PR.
- After 18 Oct: approve the Phase B plan (public pages, delete legacy CSS, enable preflight).
