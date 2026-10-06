# Design System — NeoTeam Social Run

Source of truth for the visual language. Read it before any UI work (see `AGENTS.md`). Design studies, mockups and screenshots live in `design/`.

## Surfaces

| Surface | Routes | Users | Primary device |
|---------|--------|-------|----------------|
| Public | `/`, `/registro` | Runners registering for the event | Phone |
| Admin | `/admin` | Staff: check-in, scans, draws, content | Phone on event day, laptop before it |

## Standing rules

1. **Mobile first.** Design and build at 390 px, then scale up with `min-width` queries (Tailwind `md:`/`lg:`). Touch targets ≥ 44×44 px; no hover-only interactions; form inputs set `type`, `inputmode` and `autocomplete`.
2. **Tokens only.** New CSS uses the `--neo-*`, `--space-*` and `--radius-*` tokens below; never a raw hex, px spacing or radius outside them. A missing token is added here first.
3. **Keyboard and focus.** Every interactive element is reachable by keyboard and shows a visible `:focus-visible` style. A scrollable region is focusable (`tabIndex={0}`).
4. **Motion respects `prefers-reduced-motion`.** Animations (the logo marquee, smooth scrolling) stop or become instant.
5. **Text ≥ 12 px** on any new UI (16 px for inputs, which avoids iOS zoom on focus).
6. **Icons** come from one library (the Tailwind plan adopts `lucide-react`). Until then, no new Unicode glyph icons.
7. **Copy** is Spanish, sentence case, and says what happens ("Guardar cambios", not "Enviar"). Errors say what failed and how to fix it.
8. **New home styles go in `app/home-v2.css`**; new admin styles go next to the component that uses them. No new global stylesheet.

## Tokens (`app/globals.css :root`)

### Color

| Token | Value | Use |
|-------|-------|-----|
| `--neo-black` | `#050505` | Primary text, dark surfaces |
| `--neo-white` | `#fff` | Text on dark, light surfaces |
| `--neo-accent` | `#6fa39c` | Brand accent (NeoTeam logo green) |
| `--neo-accent-dark` | `#263f3c` | Accent text and pressed states |
| `--neo-bg` | `#f4f6f5` | Page background |
| `--neo-surface` | `#fff` | Cards, panels |
| `--neo-text-secondary` | `#68716f` | Secondary text, captions |
| `--neo-border` | `rgba(5, 5, 5, 0.12)` | Hairlines, card borders |
| `--neo-danger` / `--neo-danger-bg` | `#a32929` / `#fcf0ef` | Errors, destructive actions |
| `--neo-success-bg` | `#eaf3f0` | Success feedback |

### Spacing (4 px base)

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-6` 24 · `--space-8` 32 · `--space-12` 48 · `--space-16` 64 · `--space-24` 96 (px). These match Tailwind's default scale (`1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`, `24`).

### Radius

`--radius-control` 8 px (inputs, buttons) · `--radius-card` 12 px (cards, panels).

### Typography

- **Host Grotesk** (`next/font/google`, weights 300–800) exposed as `--font-host-grotesk`, applied globally in `app/layout.tsx`.
- Target scale for new UI: 12 · 14 · 16 · 18 · 24 · 34 px.

## CSS architecture

Global stylesheets loaded in this order by `app/layout.tsx`; later files override earlier ones:

1. `globals.css`: tokens, base, public and admin components
2. `neo-overrides.css`: brand overrides and admin panel
3. `logo-marquee.css`: home logo strip
4. `home-v2.css`: editorial home v2

The Tailwind plan (`docs/superpowers/plans/2026-10-05-tailwind-and-icons.md`) replaces this layering component by component.

## Known debt (2026-10-05)

Measured on the legacy CSS; each item is fixed when its component moves to Tailwind:

- **Desktop-first**: 8 different `max-width` breakpoints (560, 600, 760, 800, 1024, 1100, 1200 px). Target: mobile base plus `md` (768) / `lg` (1024).
- **92 raw hex colors** outside the tokens (`globals.css` 33, `neo-overrides.css` 29, `home-v2.css` 30).
- **14 font sizes**, including 9–11 px labels, which are hard to read on phones.
- **Only 3 `:focus-visible` rules**: most controls rely on the browser default focus ring.
- **14 specificity inversions** (Biome `noDescendingSpecificity`) caused by the override layering.
- **Glyph icons** (`← → ↗ ✓ ↓`) instead of an icon library.
