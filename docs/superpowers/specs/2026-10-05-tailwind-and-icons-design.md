# Tailwind CSS and icon system — spec

Date: 2026-10-05 · Branch: `feat/tailwind-and-icons` (from `main`) · Status: **approved 2026-10-05; decisions 4 (icons), 8 (theme) and 9 (dates) added and approved the same day**

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
4. **Icons: `lucide-react`, chosen per screen, not only glyph swaps.** It is the same family as the `@lucide/vue` used in distriweb-pro and Product-Manager, and it is tree-shaken (only imported icons ship). Iván asked (2026-10-05) for a review of every screen to put the right icon where one helps, not just a replacement of the existing glyphs. The full inventory is in the plan, Task 3. The rules behind it:
   - **An icon means what it does, always the same thing.** One vocabulary for the whole site (table in `DESIGN.md`). `ArrowRight` = go forward inside the site; `ArrowUpRight` = opens a new tab or another site (only that); `ArrowLeft` = back; `ChevronLeft`/`ChevronRight` = carousel steps; `Plus` = create; `Pencil` = edit; `Trash2` = delete; `RefreshCw` = reload; `Search` = search; `X` = clear/close; `LogIn`/`LogOut` = session.
   - **This corrects today's meaning of `↗`.** It is used on internal calls to action ("Quiero participar ↗", "Registrarme ↗", "Cerrar sesión ↗"); those become `ArrowRight` / `LogOut`. Only "Ver página" (opens a new tab) keeps the diagonal arrow.
   - **Icons replace numbering that encodes nothing.** The admin sidebar (`01…07`), the metric cards (`01…05`) and the empty states (`00`) are not sequences; they get the section's icon. Real sequences keep their numbers: the registration form steps (`01–03`), the agenda (`01–07`) and the home section index (`01 / EL PLAN`).
   - **Status never relies on color alone.** Feedback messages (success / error) and status badges (participant, raffle, active/visible) get an icon next to the text.
   - **Restraint on the public site.** Icons go on actions, the hero meta pills and the registration facts. The display typography (hero, big numbers, agenda) stays icon-free; it is the page's signature.
   - **Sizes:** 16 px (`size-4`) inline with text, 20 px (`size-5`) in the admin nav and metric cards, 32 px (`size-8`) in empty states and the registration success mark. Stroke 2, `currentColor`, so icons inherit text color and contrast.
   - **Accessibility:** decorative icons get `aria-hidden`; icon-only buttons keep their `aria-label`; loading spinners (`LoaderCircle`) spin only under `motion-safe:`.
5. **Migration order, component by component.** When a component moves to utilities, its rules are deleted from the legacy CSS in the same commit, so there is never a period where both apply.
   - **Phase A (before 18 Oct):** setup, tokens, icons everywhere, and the **admin panel** (`app/admin/*`, internal, no public risk).
   - **Phase B (after 18 Oct):** public pages and shared components (`components/*`, `app/page.tsx`, `app/registro/*`), then delete the legacy files and enable preflight.
6. **No `cn()` / `clsx` / `tailwind-merge` yet.** Conditional classes are template strings today; the helper is added when a component needs variants. Fewer dependencies, as the rules require.
7. **Biome** parses Tailwind directives (`css.parser.tailwindDirectives: true`) and enables `nursery/useSortedClasses` only if it stays stable; otherwise class order is not enforced.

8. **Light, dark and system theme** (Iván, 2026-10-05). A three-option control, "Claro · Oscuro · Sistema", defaulting to Sistema (follows the phone or laptop setting and changes live with it).
   - **Mechanism, no dependency:** the choice is kept in `localStorage` (`neoteam-theme`); a ~15-line inline script runs before first paint, resolves "Sistema" through `matchMedia('(prefers-color-scheme: dark)')` and sets `data-theme="light|dark"` on the themed surface, so there is no flash of the wrong theme. `color-scheme` follows the theme, so native controls (date picker, selects, scrollbars) switch too. Rejected `next-themes`: one more dependency for what 15 lines do.
   - **Tokens carry the theme:** each `--neo-*` color gets a dark value under `[data-theme="dark"]`; Tailwind gets `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`. Components use tokens, so most need no `dark:` classes at all.
   - **Dark palette** (contrast checked against WCAG AA in the plan): bg `#0b0f0e`, surface `#141a19`, text `#f2f5f4`, secondary text `#9aa5a2`, border `rgba(255,255,255,0.12)`, accent `#6fa39c` (unchanged), accent text `#8fc0b8`, danger `#f08a8a` on `#2a1515`, success bg `#13261f`.
   - **Where it applies:** only on surfaces fully built on tokens, so nothing renders half dark. That is the admin once it moves to Tailwind (Task 4) and the new screens (`feat/qr-checkin`, `feat/dynamics-admin`), which are built on tokens from the start. The public pages still have 92 raw hex colors in legacy CSS; they get the theme in Phase B, after 18 Oct, when that CSS is deleted. The control appears only where the theme works: the admin sidebar now, the public header in Phase B.
9. **Dates and times: native `Intl`, no library yet** (Iván asked, 2026-10-05). Today the code only has fixed event strings (`lib/event.ts`); the coming screens need to show times (check-in time, dynamic start/end, draw time) in Colombia time. `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })` does that with zero bundle cost, and a small `lib/datetime.ts` is added by the first branch that needs it (`feat/qr-checkin`). **Temporal**, the new built-in date API, is the long-term choice, but it is not in Safari (iPhones are the main device here) nor in Node 22 (our runtime; it is native from Node 26), so today it would need a polyfill of about 20 KB on every phone. `date-fns`/`dayjs` are rejected for the same reason Temporal waits: a dependency for formatting that `Intl` already does. Revisit when Safari ships Temporal.

Rejected:
- Big-bang rewrite of all CSS: too much risk before the event.
- Heroicons / react-icons: they break consistency with the Lucide used in the other projects; react-icons bundles several sets.
- CSS Modules: they solve scoping but not consistency with the other projects.

## Mobile

Tailwind is used mobile-first: unprefixed utilities are the 390 px design, `md:`/`lg:` add desktop. When legacy CSS is desktop-first (`max-width` queries), the migration inverts it. Icons stay ≥ 16 px and icon-only buttons have ≥ 44 px hit areas. Admin is migrated with the phone as the main device: staff use it during check-in and draws. The theme control is a segmented button with three ≥ 44 px options, reachable with the thumb in the admin sidebar (which is the top bar on phones); dark mode also helps staff scanning QR codes in the early-morning light at 7:30.

## Out of scope

Visual redesign, shadcn/ui components, dark mode on the public pages before Phase B, the Phase B migration (it gets its own plan after the event).

## Risks

- Tailwind utilities live in `@layer utilities`; the legacy CSS is unlayered and **wins** any conflict. That is intended during coexistence (nothing changes until a component's legacy rules are deleted), but a utility that "does nothing" means legacy CSS still targets that element.
- Visual regressions in admin: screenshots of each admin section at 1440 and 390 px are taken before and after Phase A and compared.

Depends on: `2026-10-05-professional-tooling` (green lint and CI).
