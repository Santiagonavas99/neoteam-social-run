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
| `Ellipsis` | "Más": the phone sheet with the remaining admin sections |
| `Sun` / `Moon` / `Monitor` | Theme: light / dark / system |
| `Eye` / `EyeOff` | Visible / hidden |
| `CalendarDays` / `Clock` / `MapPin` / `Route` / `Gift` | Date / time / place / route / prizes |
| `UserCheck`, `LayoutDashboard`, `GalleryHorizontal`, `Users`, `Flag`, `Tag`, `Zap`, `ShieldCheck` | Admin sections: check-in, overview, logo strip, participants, groups, brands, dynamics, security |
| `Circle`, `CircleCheck`, `CircleSlash`, `CircleX`, `CircleDashed`, `CircleDot`, `CircleStop`, `Trophy` | Status: registered, checked in, no show, cancelled, draft, open, closed, drawn or completed |

## Tokens (`app/globals.css :root`)

### Color

Every shade is derived in OKLCH from the brand cyan `#03f8f6` (hue 193.7°); neutrals carry a trace of it (chroma 0.006–0.012). Study: `design/2026-10-05-cyan-palette.html`. **Rules:** accent used as text is always `--neo-accent-text` (`--neo-accent` and `--neo-accent-dark` are fills; the countdown on black is the only exception), and no raw hex or rgba appears outside the two token blocks in `app/globals.css`.

| Token | Light | Dark | Use · contrast (light / dark) |
|-------|-------|------|-------------------------------|
| `--neo-black` / `--neo-white` | `#050505` / `#fff` | same | Always-dark surfaces (hero, header, sidebar) and their text |
| `--neo-text` | `#050505` | `#ecf4f3` | Primary text · 19.0 on bg / 17.3 on bg |
| `--neo-text-secondary` | `#5c6565` | `#a3adad` | Captions · 6.0 on surface / 7.7 on surface |
| `--neo-bg` | `#f2f8f8` | `#080f0e` | Page background |
| `--neo-surface` | `#fff` | `#111a1a` | Cards, panels, inputs |
| `--neo-muted-bg` | `#e9f0f0` | `#202828` | Neutral badge, table heads · secondary text on it 5.2 / 6.6 |
| `--neo-border` | `rgba(5,5,5,.12)` | `rgba(255,255,255,.12)` | Hairlines only (below 3:1) |
| `--neo-border-strong` | `#737d7c` | `#6a7473` | Input and control outlines · 4.2 / 3.7 on surface |
| `--neo-accent` | `#03f8f6` | same | Brand fill; black text on it 15.3 |
| `--neo-accent-hover` | `#13e7e5` | same | Hover of accent fills |
| `--neo-accent-dark` | `#065958` | `#077271` | Deep fill under white text · 8.2 / 5.8 |
| `--neo-accent-text` | `#077271` | `#24fdfa` | Accent as text · 5.8 / 13.9 on surface |
| `--neo-accent-soft` | `#defffd` | `#002d2d` | Success and active badges, with accent text · 5.4 / 11.7 |
| `--neo-accent-border` | `#7fdddb` | `#046261` | Decorative cyan borders |
| `--neo-success-bg` | alias of `--neo-accent-soft` | | Cyan already means "done" |
| `--neo-danger` / `-bg` | `#a32929` / `#fcf0ef` | `#f08a8a` / `#2a1515` | Errors, destructive · 6.5 / 7.2 |
| `--neo-warning` / `-bg` | `#8a5601` / `#fef2d9` | `#edbb64` / `#32230e` | No-show status · 5.5 / 8.6 |
| `--neo-on-dark-secondary` | `#c2cdcd` | same | Secondary text on black · 12.5 |
| `--neo-on-dark-border` / `-hover` | `#27302f` / `#192121` | same | Dividers and hover on black |
| `--neo-brand-cyan` | `#007a78` | `#02f2f8` | Logo accent only |

The dark values apply under `[data-theme="dark"]`: the admin theme switch sets it; the public pages get it in Phase B.

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

- **Admin (`/admin`)**: Tailwind only, mobile first. No admin rules remain in the global stylesheets. The theme root is `app/admin/layout.tsx` (`#admin-theme`, with a pre-paint script from `lib/theme.ts`); the switch ("Claro · Oscuro · Sistema") lives in the sidebar's "Cuenta" group and in the phone "Más" sheet.
- **Public (`/`, `/registro`, `/pase`)**: legacy global CSS loaded by `app/layout.tsx` in this order, later files overriding earlier ones: `globals.css` (tokens, base, public components) → `home-v2.css`. Registration, the pass card, the theme menu and the logo strip are already Tailwind. The rest moves in Phase B, after 18 Oct.
- Admin navigation is grouped by moment in `features/admin/sections.ts` (`group`, `primary`): phones get a bottom tab bar with the primary sections plus "Más"; from `md` a black sidebar shows the three groups.

## Known debt (2026-10-05)

Measured on the public legacy CSS (the admin is clear of all of it); each item is fixed when its component moves to Tailwind:

- **Desktop-first**: 8 different `max-width` breakpoints (560, 600, 760, 800, 1024, 1100, 1200 px). Target: mobile base plus `md` (768) / `lg` (1024).
- **31 raw hex colors** left in `home-v2.css` (public home, Phase B). `globals.css` has none outside the token blocks.
- **Absolute surfaces on the public site**: hero, header and agenda paint with `--neo-white`/`--neo-black`; they move to `--neo-surface`/`--neo-text` when the public pages get the theme in Phase B.
- **14 font sizes**, including 9–11 px labels, which are hard to read on phones.
- **Only 3 `:focus-visible` rules**: most controls rely on the browser default focus ring.
- **14 specificity inversions** caused by the override layering. Biome's `noDescendingSpecificity` is switched off for `home-v2.css` only (`biome.json`); remove that override when the file is deleted.
