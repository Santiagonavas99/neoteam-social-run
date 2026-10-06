# Cyan palette and admin layout — spec

Date: 2026-10-05 · Branch: `refactor/admin-tailwind` · Status: **approved** (Iván, 2026-10-05: "si dale")

Design study: [`design/2026-10-05-cyan-palette.html`](../../../design/2026-10-05-cyan-palette.html), published as a private artifact for review. Extends [`2026-10-05-tailwind-and-icons-design.md`](2026-10-05-tailwind-and-icons-design.md) (Phase A, theme).

## Problem

1. **The palette does not hold together.**
   - There are 39 hard-coded colors in `globals.css` and `neo-overrides.css`, outside the tokens: greenish greys, one-off badge colors, and nine different greys on black.
   - They do not change with the theme, so the dark mode from Task 4b would break on them.
   - The input border is `#b8c1be`, which is 1.8:1 on white and below the 3:1 a control outline needs.
   - Bright cyan used as text (the 01/02/03 form steps) is about 1.3:1.
2. **The admin layout fails at 390 px**, which is how staff use it on event day:
   - **Navigation:** the eight sections sit in one scrolling row. Dinámicas, Grupos, Marcas and Seguridad start off-screen.
   - **Header:** about 230 px of breadcrumb, eyebrow, title and description come before any content.
   - **Participants:** each runner card is about 380 px tall. For 128 runners that is around 48,000 px of scrolling, and "Eliminar" is a filled red button that outweighs Check-in.
   - **Overview:** its "Gestiona el encuentro" list repeats the navigation, and every metric gets the same weight, although check-in progress is what matters on the day.

## Decisions

1. **One hue.**
   - Every neutral and accent shade is derived in OKLCH from the brand cyan `#03f8f6` (hue 193.7°).
   - The neutrals carry a trace of that cyan (chroma 0.006–0.012) instead of today's green.
   - The values and contrasts are the study's table. Every text pair reaches at least 4.5:1, and every control border at least 3:1, in both themes.
2. **Token names stay; values change.** This keeps the diff small: no renames across the ~25 call sites.
   - `--neo-accent-dark` keeps its name and becomes the deep fill: `#065958` light, `#077271` dark.
   - `--neo-success-bg` becomes an alias of `--neo-accent-soft`, because in NeoTeam cyan already means "done".
3. **New tokens:**
   - `--neo-border-strong` for input and control outlines;
   - `--neo-muted-bg` for the neutral badge, table heads and editors;
   - `--neo-warning` and `--neo-warning-bg` for the no-show status;
   - `--neo-on-dark-secondary`, `--neo-on-dark-border` and `--neo-on-dark-hover` for always-black surfaces (sidebar, header, hero).
4. **Accent as text is always `--neo-accent-text`.** `--neo-accent` and `--neo-accent-dark` are fills only. The countdown on black is the exception.
5. **Admin navigation by moment.**
   - **On phones:** a bottom tab bar with Check-in, Participantes, Dinámicas and Más. "Más" opens a sheet with Overview, Carrusel de logos, Grupos, Marcas, Seguridad, the theme switch and "Cerrar sesión".
   - **From `md` up:** the sidebar groups the same sections under "Día del evento", "Contenido del sitio" and "Cuenta".
   - `sections.ts` holds the group and which sections are primary; there is no second list.
6. **Compact section header:**
   - title 24 px on phones, 34 px from `md`;
   - one line of description;
   - the breadcrumb and "Ver página" move into the sidebar and the "Más" sheet.
7. **Participants as rows.**
   - Each runner is a row of at least 64 px: name, code and group, plus a status badge.
   - Tapping a row opens it with native `<details>`, showing contact, size, the status select, Check-in and "Eliminar" as a red text button.
   - The status filter becomes chips with counts.
   - "Actualizar" becomes a 44 px icon-only button with an `aria-label`.
8. **Overview leads with check-in.**
   - The first card is "Check-in X / Y" on black, with a cyan progress bar; the other metrics follow, smaller.
   - Active dynamics are listed below.
   - The quick-access list and the `quickAccess` field are deleted.

## Alternatives rejected

- **Renaming `accent-dark` to `accent-strong`** is clearer, but it touches every call site and the public CSS. Rejected for now; it can happen in Phase B.
- **A hamburger menu on phones** hides the day-of-event sections behind two taps. The bottom bar puts them under the thumb.
- **Keeping the participant cards and only shortening them** still leaves a destructive filled button on every runner.

## Mobile

- Everything is designed at 390 px first.
- **Tab bar:** at least 56 px tall, with `env(safe-area-inset-bottom)` padding.
- **Touch targets:** 44 px minimum.
- **Scrolling:** no horizontal page scroll (only the filter chips scroll sideways, inside their own row).
- **Cost:** no new dependency and no client JavaScript beyond the "Más" sheet toggle.

## Security

No change: this only moves UI. Sign-out stays reachable on every screen, from the "Más" sheet on phones and the sidebar on desktop.

## Out of scope

- `home-v2.css` (31 colors) and the public home: Phase B, after 18 Oct. Its colors are listed in `DESIGN.md` Known debt.
- Renaming tokens.
