# Plan — Hero atmosphere and agenda information cleanup

Spec: `docs/superpowers/specs/2026-10-08-hero-atmosphere-agenda-clarity-design.md`
Branch: `feat/hero-atmosphere-agenda-clarity`
Approved: user expressly requested implementation and a pull request for the three reviewed changes.

1. **Docs**: add this spec and approved plan, mentioning constraints and mobile QA.
2. **Agenda** (`features/home/sections/agenda.tsx`, `features/home/sections/agenda.module.css`): remove the footer note and its CSS; replace only the redundant sticky board "DOM 18 / OCTUBRE" with "5K / RUTA SOCIAL". Preserve the large left date signature, right activity count/hours, timeline and statuses.
3. **Hero** (`features/home/sections/hero.tsx`, `app/home-v2.css`): keep date, time, route distance chips; add location chip, move mobile layout to two compact rows; remove hero grid background; layer a token-based cyan atmospheric glow and a very low-contrast fine grain, no motion or fetched files.
4. **Release** (`package.json`, `CHANGELOG.md`): bump to `0.29.0` and note the visible changes, preserving existing release history.
5. **Verification**: GitHub Actions `pnpm ci:check` and SQL tests, Vercel preview READY. Manual visual QA at 390px, 430px, 1024px and 1440px including both themes and overflow. Do not merge or deploy production until requested.
