# Plan — Sticky public navigation

Spec: `docs/superpowers/specs/2026-10-07-sticky-site-header-design.md`

Branch: `feat/sticky-site-header`

Status: awaiting explicit OK.

Release: `0.26.0` because persistent navigation is new public behavior.

## 1. Move the header outside the Hero

Files:
- `features/home/sections/hero.tsx`
- `app/page.tsx`

Changes:
- remove `SiteHeader` from `Hero`;
- render `SiteHeader` once before `Hero` in the Home composition.

Checks:
- no duplicate header;
- Hero content order unchanged;
- public routes outside Home remain unaffected.

## 2. Make the navigation sticky and full-width

Files:
- `components/site-header.tsx`
- `app/globals.css`
- `app/home-v2.css`

Changes:
- add an inner constrained wrapper to the header;
- make the outer header full-width and sticky at `top: 0`;
- preserve the current desktop/mobile heights and visual width;
- add a dark translucent surface and subtle backdrop blur;
- keep the current hairline and theme/register controls;
- update Home-specific width overrides to target the inner wrapper.

Checks:
- 390 px, 1024 px, 1440 px;
- header remains visible from Hero through Footer;
- no horizontal shift when sticky;
- mobile controls remain ≥44 px.

## 3. Preserve Hero geometry and anchor positioning

Files:
- `app/home-v2.css`

Changes:
- adjust Hero min-height to account for the now external header;
- update the Hero background grid inset;
- add scroll-margin to `#evento`, `#agenda`, `#invitados` so sticky nav does not cover headings.

Checks:
- first viewport remains visually balanced;
- clicking Evento / Agenda / Invitados lands with heading visible;
- no extra blank gap under the header.

## 4. Release

Files:
- `package.json`
- `CHANGELOG.md`

Changes:
- bump to `0.26.0`;
- document sticky public navigation.

Final checks:
- `pnpm ci:check`;
- SQL tests;
- Vercel preview `READY`;
- no production deploy until explicitly requested.
