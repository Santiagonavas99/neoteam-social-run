# Mobile facts-to-metrics divider fix — approved implementation plan

Spec: `docs/superpowers/specs/2026-10-07-mobile-story-metrics-divider-design.md`
Branch: `fix/mobile-story-metrics-divider`
Approved: user explicitly requested "hazlo, crea el fix con eso".

1. Change `app/home-v2.css` only in the mobile media query: tighten the lower padding on story and upper padding on numbers with design tokens, and hide the second rule only when story and numbers are adjacent. Inspect selector specificity and placement.
2. Publish release `0.28.2` in `package.json` and `CHANGELOG.md`. No new dependencies.
3. Run `pnpm ci:check` (Biome, TS, tests, build) and SQL tests via GitHub Actions; check Vercel preview. Create PR without merging into production.

Manual QA targets: no double border under the date/time/distance stats at 390px, 430px, correct centered metrics and internal divider; desktop unchanged at 1024px and 1440px; if Numbers is reordered, it retains its own upper border.
