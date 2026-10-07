# Final section centering

## Problem

The final "Nos vemos" section uses an asymmetric desktop grid: `88px 1fr` with a 42 px gap. The date and meeting block are placed in the second column, so their visual center is shifted to the right of the shell's real center. This remains visible on laptop-sized screens even when the content itself has `text-align: center`.

## Decision

Keep the editorial index on the left without letting it participate in the content width. The grid becomes symmetric and the two content blocks span the full shell:

- the index stays in the left editorial zone;
- the date/CTA spans the full grid width on the same row;
- the meeting/map spans the full grid width below it;
- at widths up to 1100 px, the section collapses to the existing single-column flow.

## Why

The offset is structural, not a breakpoint-specific alignment issue. Centering inside the second column can never equal the center of the shell while only a left editorial column exists. Letting the content span the full shell fixes the date and map at every width while keeping the visual index.

## Mobile

At 390 px, 768 px, 1024 px and laptop widths, the date and map must share the same centered shell. The map may be full-width inside the shell. The index returns to normal document flow at widths up to 1100 px.

## Security

No data, auth, API, or Supabase changes.

## Out of scope

- Redesigning the final section.
- Changing the date copy, map provider, CTA or section order.
