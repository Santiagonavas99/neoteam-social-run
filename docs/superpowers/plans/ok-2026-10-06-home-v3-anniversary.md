# Home V3 — Anniversary editorial landing implementation plan

Spec: `docs/superpowers/specs/2026-10-06-home-v3-anniversary-design.md`  
Branch: `feat/home-v3-anniversary`  
Base/dependency: `feat/cyan-accent-refresh`

## 1. Add the isolated V3 route and composition

Files:
- `app/v3/page.tsx`
- `features/home/v3/home-v3.tsx`
- `features/home/v3/content.ts`
- `DESIGN.md`

Changes:
- Add `/v3` as a comparison route; keep `/` on V2.
- Fetch the same live community/logo data as V2.
- Define anniversary editorial copy in one V3 content module.
- Document V3 as an intentional design study and allow a V3-scoped stylesheet.

Checks:
- `/` renders unchanged.
- `/v3` renders without new backend calls beyond the existing home data.
- No production navigation links to `/v3` are added.

Commit: `feat: add anniversary home v3 route`

## 2. Build the hero, manifesto and agenda

Files:
- `features/home/v3/hero-v3.tsx`
- `features/home/v3/manifesto-v3.tsx`
- `features/home/v3/agenda-v3.tsx`
- `app/home-v3.css`
- `app/layout.tsx`

Changes:
- Build the anniversary thesis hero with countdown and existing actions.
- Add the manifesto/facts section.
- Reuse `agenda` data in a condensed editorial sequence.
- Load a stylesheet scoped under `.home-v3`.

Checks:
- 390 px first: no overflow, CTAs ≥44 px, hero copy remains readable.
- 1024 and 1440 px: editorial scale and alignment hold.
- Countdown behavior remains shared and unchanged.

Commit: `feat: build v3 anniversary opening`

## 3. Build the two editorial split sections

Files:
- `features/home/v3/anniversary-split.tsx`
- `app/home-v3.css`

Changes:
- Add the `CORREMOS JUNTOS. CELEBRAMOS JUNTOS.` split.
- Add the `LA META ES SOLO EL COMIENZO.` split with reversed composition.
- Use replaceable atmospheric media placeholders for the mockup; do not hotlink or copy the reference image.
- Use the approved cyan/neutral palette and keep the two sections visually distinct.

Checks:
- Mobile stacking order follows the spec.
- Placeholder media has no inaccessible text baked into it.
- No layout shift from unknown image dimensions.
- No horizontal scroll at 390 px.

Commit: `feat: add anniversary editorial story blocks`

## 4. Reframe live community content for V3

Files:
- `features/home/v3/community-v3.tsx`
- `app/home-v3.css`

Changes:
- Reuse existing `CommunityCarousel` and live Supabase content.
- Reframe the heading and section surface around the anniversary narrative.
- Preserve existing carousel semantics and controls.

Checks:
- Empty groups/categories still disappear safely.
- Carousel remains keyboard/touch usable.
- 390 px and desktop visual pass.

Commit: `feat: reframe v3 community section`

## 5. Build final CTA and oversized anniversary footer

Files:
- `features/home/v3/final-v3.tsx`
- `features/home/v3/footer-v3.tsx`
- `app/home-v3.css`

Changes:
- Add the final event CTA with `18.10.26`.
- Add the compact footer navigation/details.
- Add the oversized `CELEBREMOS` closing treatment.
- Crop the display word intentionally at small widths without causing horizontal overflow.

Checks:
- Footer links are keyboard reachable.
- Footer never creates horizontal scroll at 390 px.
- `CELEBREMOS` remains legible from 390 through 1440 px.

Commit: `feat: finish v3 anniversary landing`

## 6. Visual/accessibility cleanup

Files:
- Only V3 components/CSS and shared design tokens if strictly required.

Checks:
- 390 px: full page pass.
- 1024 px: full page pass.
- 1440 px: full page pass.
- keyboard focus pass.
- `prefers-reduced-motion` pass.
- contrast check for cyan surfaces and secondary text.
- verify `/` V2 has not changed visually.

Commit if corrections are needed: `fix: polish home v3 responsive details`

## 7. Changelog and release

Files:
- `CHANGELOG.md`
- `package.json`

Changes:
- Note the V3 comparison route under the release.
- Rebase on the current target branch before choosing the next version.
- Finish with the release commit required by `AGENTS.md`.

Commit: `chore(release): <next-version>`

## Final repository checks

Run:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm ci:check`

Vercel preview is desirable for visual comparison but its current build-rate limit must be reported separately from repository/build correctness.
