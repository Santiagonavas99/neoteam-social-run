# NeoTeam logo and favicon — plan

Spec: [`2026-10-05-brand-logo-design.md`](../specs/2026-10-05-brand-logo-design.md) · Branch: `feat/brand-logo`

## Tasks

### 1. `docs: brand logo spec and plan`

- The spec, this plan, and `design/brand/`: the original SVGs plus the two background previews.

### 2. `feat: favicon`

- Add `app/icon.svg`: the "NT" paths centered on a 64×64 black square with 14 px rounded corners. Cyan stays `#02F2F8`, which works because the square is black.
- **Check:** after `pnpm build`, the `/` HTML has `<link rel="icon" href="/icon.svg…">`. Screenshot the icon at 16 and 32 px on white and on `#202124`.

### 3. `feat: NeoTeam logo in the header`

- **`components/neoteam-logo.tsx`:** an inline SVG built from `design/brand/logo_neoteam.svg`.
  - Fills: `currentColor` and `var(--neo-brand-cyan)`.
  - `aria-hidden`; height set through `className`.
- **`components/brand-link.tsx`:** render `<NeoTeamLogo className="h-8 w-auto md:h-9" />`; `aria-label` defaults to `NeoTeam`.
- **`app/registro/page.tsx`:** replace the copied brand markup with `<BrandLink />`.
- **`app/globals.css`:**
  - `--neo-brand-cyan: #007a78` in `:root`;
  - `#02F2F8` in the dark theme block, `.site-header` and `.admin-sidebar`;
  - delete `.brand-mark` (both rules) and the `.brand` text styles that no longer apply.
- **`DESIGN.md`:**
  - add the `--neo-brand-cyan` token row;
  - add the rule "the logo is `NeoTeamLogo`; never an `<img>` of the white file on a light surface".
- **Checks:**
  - screenshots at **390 px first**, then 1440 (`scratchpad/pw/shots.cjs`): home header, `/registro`, admin login, admin sidebar;
  - the logo can be read on every surface;
  - nothing wraps at 390 px;
  - the link is at least 44 px tall.

### 4. `feat: link preview for WhatsApp and social` (spec addendum, decisions 6–9; awaiting OK)

- **`app/opengraph-image.png`:** a Playwright screenshot of `design/brand/share-image.html` at 1200×630.
- **`app/layout.tsx`:** add `openGraph`, `twitter` and the share description to `metadata`.
- **`app/registro/page.tsx`:** add `export const metadata` with its own title and description.
- **`app/admin/page.tsx`:** add `export const metadata = { robots: { index: false, follow: false } }`.
- **Checks:**
  - after `pnpm build && pnpm start`, `curl -s localhost:3100/ | grep -o '<meta[^>]*og:[^>]*>'` lists `og:title`, `og:description`, `og:image` (with width and height), `og:locale` and `twitter:card`;
  - `/registro` shows its own `og:title`;
  - `/admin` has `noindex`;
  - the image is under 300 KB;
  - after deploy (Iván), check the preview in the Facebook Sharing Debugger and with a real WhatsApp share.

### 5. `chore(release): 0.3.0`

- `CHANGELOG.md`:
  - under `[Unreleased]`, add `Added` entries for the logo and favicon and for the link preview;
  - rename that section to `## [0.3.0] - 2026-10-05`;
  - add an empty `[Unreleased]` above it.
- `package.json` `version`: `0.3.0`.

## Done when

- `pnpm ci:check` passes.
- The 390 and 1440 screenshots are reviewed.
- The branch stays local until Iván says to push it.
