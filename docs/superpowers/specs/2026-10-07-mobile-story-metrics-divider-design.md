# Mobile story and metrics separators — fix design

Date: 2026-10-07 · Branch: `fix/mobile-story-metrics-divider` · Screenshot: iPhone, `socialrun.site`, story facts immediately followed by runner/brand metrics.

## Problem
Mobile shows two horizontal rules in succession: the story's three-column facts have `.v2-fact-list` `border-bottom`, while `.v2-numbers` has an independent `border-top`. The gap between them makes the transition feel empty. Desktop spacing and rules are already correct.

## Decision
In the existing mobile breakpoint (`max-width: 760px`), keep the story facts' bottom separator as the one visible rule. When `.v2-numbers` immediately follows `.v2-story`, remove only the numbers' top border using the adjacent sibling selector. Use existing `--space-6` (24px) for story's bottom padding and numbers' top padding to make the flow more compact. Preserve desktop CSS and reordering behavior: when the admin moves Numbers somewhere else, its border remains visible.

## Constraints and alternatives
- No new UI, icons, fonts, colors, dependencies or JavaScript; preserve the dark/light theme.
- Do not delete the base `.v2-numbers` `border-top` globally: that would remove useful separation when Numbers is placed after a different section.
- Keep the facts separator and the metrics vertical divider untouched.
- Mobile: verify at 390px and 430px; desktop: verify the unchanged layout at 1024px/1440px. Run `pnpm ci:check` and SQL workflow.

## Out of scope
Admin, database, registration, carousel, Wallet, content and desktop modifications.
