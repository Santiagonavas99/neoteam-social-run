# Plan — Hero atmosphere and agenda information cleanup

Spec: `docs/superpowers/specs/2026-10-08-hero-atmosphere-agenda-clarity-design.md`
Branch: `feat/hero-atmosphere-agenda-clarity`
Approved: user expressly requested implementation and a pull request for the three reviewed changes.

1. **Docs**: add this spec and approved plan, mentioning constraints and mobile QA.
2. **Agenda** (`features/home/sections/agenda.tsx`, `features/home/sections/agenda.module.css`): remove the footer note and its CSS; replace only the redundant sticky board "DOM 18 / OCTUBRE" with "5K / RUTA SOCIAL". Preserve the large left date signature, right activity count/hours, timeline and statuses.
3. **Hero** (`features/home/sections/hero.tsx`, `app/home-v2.css`): keep date, time, route distance chips; add location chip, move mobile layout to two compact rows; remove hero grid background; layer a token-based cyan atmospheric glow and a very low-contrast fine grain, no motion or fetched files.
4. **Release** (`package.json`, `CHANGELOG.md`): bump to `0.29.0` and note the visible changes, preserving existing release history.
5. **Verification**: GitHub Actions `pnpm ci:check` and SQL tests, Vercel preview READY. Manual visual QA at 390px, 430px, 1024px and 1440px including both themes and overflow. Do not merge or deploy production until requested.

## Approved corrections from preview — 2026-10-08
6. In `features/home/sections/agenda.tsx` and `agenda.module.css`, show `AGENDA` prominently and `5K · RUTA SOCIAL` smaller; stack on phones and preserve right-side activity count and time.
7. In `features/home/sections/hero.tsx` and `app/home-v2.css`, restore the three original metadata chips and the compact two-then-one mobile layout; increase cyan radial glow and fine static grain prominence without touching route card, CTA, or structure.
8. Revise the `0.29.0` `CHANGELOG.md` entry to reflect the approved final content. Retest the updated PR with GitHub Actions and Vercel; do not publish to production.

9. **Approved grain visibility adjustment:** in `app/home-v2.css` change only SVG grain tile 160→120, frequency .82→.9, overlay opacity .13→.18; keep radial glow untouched. Update changelog and spec, rerun PR checks and Vercel preview.
