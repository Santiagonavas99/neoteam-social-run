# Centered mobile hero — design spec

Date: 2026-10-07 · Branch: `fix/mobile-hero-centered`

## Decision

At phone widths (≤760 px), the hero becomes a centered composition while desktop remains unchanged.

- Event pills are centered in a 2 + 1 layout.
- ANIVERSARIO NEOTEAM, SOCIAL and RUN are centered.
- The supporting copy and CTA row are centered.
- The countdown uses four equal columns and centered labels/values.
- The route card is centered as a block while preserving left-aligned internal details.
- The title scale is reduced slightly so SOCIAL/RUN breathe inside the shell.

No auth, data, Supabase or business-logic changes.
