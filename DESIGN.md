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
6. **Icons** come from `lucide-react` only: no Unicode glyphs (`← → ↗ ✓`), no inline SVG. One icon, one meaning, everywhere (table below). Decorative icons get `aria-hidden`; icon-only buttons have an `aria-label` and a 44 px target. Sizes: `size-4` inline with text, `size-5` in navigation and metric cards, `size-8` in empty states. Icons replace numbering that encodes nothing (admin nav, metrics, empty states); real sequences keep their numbers (form steps, agenda, home section index). Status never relies on color alone. Spinners use `motion-safe:animate-spin`.
7. **Copy** is Spanish, sentence case, and says what happens ("Guardar cambios", not "Enviar"). Errors say what failed and how to fix it.
8. **Logo** is `NeoTeamLogo` (`components/neoteam-logo.tsx`), usually through `BrandLink`: letters in `currentColor`, accent in `--neo-brand-cyan`, so it reads on light and dark surfaces. Never an `<img>` of the white file in `design/brand/`. Favicon: `app/icon.svg`.
9. **New home styles go in `app/home-v2.css`**; new admin styles go next to the component that uses them. No new global stylesheet.

### Icon vocabulary

| Icon | Meaning |
|------|---------|
| `ArrowRight` | Go forward inside the site (calls to action, submit) |
| `ArrowUpRight` | Opens a new tab or another site, only that |
| `ArrowLeft` | Back |
| `ArrowDown` | Jump down the page |
| `ChevronLeft` / `ChevronRight` | Carousel step; `ChevronRight` also ends a navigation row |
| `Plus` / `Pencil` / `Trash2` / `Check` | Create / edit / delete / save |
| `RefreshCw` / `Search` / `X` / `SearchX` | Reload / search / clear / no results |
| `LogIn` / `LogOut` / `KeyRound` | Enter the panel / sign out / PIN |
| `CircleCheck` / `CircleAlert` / `TriangleAlert` | Success / error / destructive confirmation |
| `LoaderCircle` | Work in progress |
| `Dices` | Draw winners |
| `ScanLine` | Register a runner in a dynamic |
| `UserCheck` | Check-in |
| `QrCode` | The runner's check-in pass ("Mi pase") |
| `Wallet` | Add the pass to Google Wallet |
| `Eye` / `EyeOff` | Visible / hidden |
| `CalendarDays` / `Clock` / `MapPin` / `Route` / `Gift` | Date / time / place / route / prizes |
| `UserCheck`, `LayoutDashboard`, `GalleryHorizontal`, `Users`, `Flag`, `Tag`, `Zap`, `ShieldCheck` | Admin sections: check-in, overview, logo strip, participants, groups, brands, dynamics, security |
| `Circle`, `CircleCheck`, `CircleSlash`, `CircleX`, `CircleDashed`, `CircleDot`, `CircleStop`, `Trophy` | Status: registered, checked in, no show, cancelled, draft, open, closed, drawn or completed |

## Tokens (`app/globals.css :root`)

### Color

| Token | Value | Use |
|-------|-------|-----|
| `--neo-black` | `#050505` | Always-dark surfaces (hero), text on accent. Same in both themes |
| `--neo-white` | `#fff` | Text on always-dark surfaces. Same in both themes |
| `--neo-text` | `#050505` | Primary text on `--neo-bg` / `--neo-surface` (follows the theme) |
| `--neo-accent` | `#03f8f6` | Primary NeoTeam cyan for buttons, borders and highlights |
| `--neo-brand-cyan` | `#007a78` light / `#02f2f8` dark | Logo accent only. Dark value on `.site-header`, `.admin-sidebar` and the dark theme |
| `--neo-accent-dark` | `#007a78` | Deep cyan for filled states that need white text |
| `--neo-accent-text` | `#007a78` | Accessible accent text on light surfaces |
| `--neo-accent-hover` | `#02d9d7` | Softer cyan hover for bright accent controls |
| `--neo-accent-soft` / `--neo-accent-border` | `#e7fbfb` / `#7fd8d6` | Soft cyan surfaces and supporting borders |
| `--neo-bg` | `#f4f6f5` | Page background |
| `--neo-surface` | `#fff` | Cards, panels |
| `--neo-text-secondary` | `#68716f` | Secondary text, captions |
| `--neo-border` | `rgba(5, 5, 5, 0.12)` | Hairlines, card borders |
| `--neo-danger` / `--neo-danger-bg` | `#a32929` / `#fcf0ef` | Errors, destructive actions |
| `--neo-success-bg` | `#eaf3f0` | Success feedback |

### Dark theme

Values under `[data-theme="dark"]` in `app/globals.css`. Inert until a surface sets the attribute (admin theme switch, plan Task 4b); the public pages get it in Phase B.

| Token | Dark | Contrast (WCAG) |
|-------|------|-----------------|
| `--neo-text` | `#f2f5f4` | 17.6:1 on bg, 16.1:1 on surface |
| `--neo-bg` | `#0b0f0e` | — |
| `--neo-surface` | `#141a19` | — |
| `--neo-text-secondary` | `#9aa5a2` | 7.6:1 on bg, 7.0:1 on surface |
| `--neo-accent` | `#03f8f6` (unchanged) | Bright brand accent; use dark text on filled controls |
| `--neo-accent-dark` | `#006b6a` | Deep cyan fill; white text remains readable |
| `--neo-accent-text` | `#67fffd` | High-contrast accent text on dark surfaces |
| `--neo-danger` / `--neo-danger-bg` | `#f08a8a` / `#2a1515` | 7.2:1 |
| `--neo-success-bg` | `#13261f` | text 14.5:1 |
| `--neo-border` | `rgba(255, 255, 255, 0.12)` | Hairline only; like the light border it is below 3:1, so input outlines need a stronger border when they move to Tailwind |

Light pairs for reference: text/bg 18.8:1, secondary/surface 5.0:1, secondary/bg 4.6:1, danger 6.5:1.

### Spacing (4 px base)

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-6` 24 · `--space-8` 32 · `--space-12` 48 · `--space-16` 64 · `--space-24` 96 (px). These match Tailwind's default scale (`1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`, `24`).

### Radius

`--radius-control` 8 px (inputs, buttons) · `--radius-card` 12 px (cards, panels).

### Typography

- **Host Grotesk** (`next/font/google`, weights 300–800) exposed as `--font-host-grotesk`, applied globally in `app/layout.tsx`.
- Target scale for new UI: 12 · 14 · 16 · 18 · 24 · 34 px.

## Tailwind

Tailwind 4 (`app/tailwind.css`, loaded first in `app/layout.tsx`) runs **without preflight** next to the legacy CSS. Unlayered legacy rules win over utilities, so a utility that "does nothing" means a legacy rule still targets that element. The theme reads the tokens above (`@theme inline`), so changing a token changes both worlds.

| Token | Utility |
|-------|---------|
| `--neo-<name>` colors | `bg-neo-<name>`, `text-neo-<name>`, `border-neo-<name>` (e.g. `text-neo-text-secondary`) |
| `--space-N` | Tailwind's default spacing: `p-N`, `gap-N`, `m-N` (same 4 px steps) |
| `--radius-control` / `--radius-card` | `rounded-control` / `rounded-card` |
| Host Grotesk | `font-sans` (default) |
| Dark theme | `dark:` variant, active under `[data-theme="dark"]` |

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
- **14 specificity inversions** caused by the override layering. Biome's `noDescendingSpecificity` is switched off for `home-v2.css` and `neo-overrides.css` only (`biome.json`); remove that override when those files are deleted.
