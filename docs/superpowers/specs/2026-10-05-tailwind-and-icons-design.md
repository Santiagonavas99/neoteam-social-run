# Tailwind CSS and icon system — spec

Date: 2026-10-05 · Branch: `feat/tailwind-and-icons` (from `chore/professionalize-tooling` once merged) · Status: **awaiting OK**

## Problem

Styling is 2,926 lines of hand-written global CSS in four layered files (`globals.css` 1,267 → `neo-overrides.css` 931 → `logo-marquee.css` 91 → `home-v2.css` 637). Later files override earlier ones, which shows up as 14 `noDescendingSpecificity` warnings. Icons are Unicode characters typed into the JSX (`↗` ×7, `→` ×6, `←` ×3, `✓` ×2, `↓` ×1), which render differently across fonts and platforms and cannot be sized or aligned consistently. Iván's other projects use Tailwind 4 and Lucide; this one should too.

## Design review

- No visual redesign: the target is the **same look**, expressed in Tailwind. The `--neo-*`, `--space-*` and `--radius-*` tokens in `app/globals.css :root` are the source of truth and become the Tailwind theme.
- `frontend-design` skill: the quality floor applies (visible focus, reduced motion, accessible names on icon-only controls); type stays Host Grotesk (`--font-host-grotesk`).
- **Event constraint:** the public site (`/`, `/registro`) is live with registrations open until 18 Oct 2026. Rewriting its CSS 13 days before the event risks visual regressions on the page that brings in participants.

## Decisions

1. **Tailwind 4 through PostCSS** (`tailwindcss`, `@tailwindcss/postcss`, `postcss.config.mjs`), the Next.js-supported path. The Vite plugin used in distriweb-pro does not apply to Next.
2. **Coexistence without preflight at first.** `app/tailwind.css` imports only `tailwindcss/theme.css` and `tailwindcss/utilities.css`, not preflight, so the existing base styles stay exactly as they are. Preflight comes in when the last legacy file is deleted.
3. **Tokens bridged, not duplicated.** An `@theme inline` block maps the existing variables (`--color-neo-accent: var(--neo-accent)`, `--spacing-*`, `--radius-card`, `--font-sans: var(--font-host-grotesk)`), so `bg-neo-accent`, `rounded-card`, etc. read the same values the legacy CSS uses.
4. **Icons: `lucide-react`.** It is the same family as the `@lucide/vue` used in distriweb-pro and Product-Manager, and it is tree-shaken (only imported icons ship). Mapping: `→` `ArrowRight`, `←` `ArrowLeft`, `↗` `ArrowUpRight`, `✓` `Check`, `↓` `ArrowDown`. Decorative icons get `aria-hidden`; icon-only buttons keep their `aria-label` (they already have one). Default size 16 (`size-4`), stroke 2, `currentColor`.
5. **Migration order, component by component.** When a component moves to utilities, its rules are deleted from the legacy CSS in the same commit, so there is never a period where both apply.
   - **Phase A (before 18 Oct):** setup, tokens, icons everywhere, and the **admin panel** (`app/admin/*`, internal, no public risk).
   - **Phase B (after 18 Oct):** public pages and shared components (`components/*`, `app/page.tsx`, `app/registro/*`), then delete the legacy files and enable preflight.
6. **No `cn()` / `clsx` / `tailwind-merge` yet.** Conditional classes are template strings today; the helper is added when a component needs variants. Fewer dependencies, as the rules require.
7. **Biome** parses Tailwind directives (`css.parser.tailwindDirectives: true`) and enables `nursery/useSortedClasses` only if it stays stable; otherwise class order is not enforced.

Rejected:
- Big-bang rewrite of all CSS: too much risk before the event.
- Heroicons / react-icons: they break consistency with the Lucide used in the other projects; react-icons bundles several sets.
- CSS Modules: they solve scoping but not consistency with the other projects.

## Mobile

Tailwind is used mobile-first: unprefixed utilities are the 390 px design, `md:`/`lg:` add desktop. When legacy CSS is desktop-first (`max-width` queries), the migration inverts it. Icons stay ≥ 16 px and icon-only buttons have ≥ 44 px hit areas. Admin is migrated with the phone as the main device: staff use it during check-in and draws.

## Out of scope

Visual redesign, dark mode, shadcn/ui components, the Phase B migration (it gets its own plan after the event).

## Risks

- Tailwind utilities live in `@layer utilities`; the legacy CSS is unlayered and **wins** any conflict. That is intended during coexistence (nothing changes until a component's legacy rules are deleted), but a utility that "does nothing" means legacy CSS still targets that element.
- Visual regressions in admin: screenshots of each admin section at 1440 and 390 px are taken before and after Phase A and compared.

Depends on: `2026-10-05-professional-tooling` (green lint and CI).
