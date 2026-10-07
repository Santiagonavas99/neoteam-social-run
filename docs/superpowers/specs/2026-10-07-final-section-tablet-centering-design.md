# Final section tablet centering

## Problem

At intermediate widths, the final "Nos vemos" section still uses the desktop two-column grid (`88px + 1fr`). The section index occupies the first column, so the date and meeting block are centered inside the second column instead of the viewport shell. This makes the large date look pushed to the right and keeps the map aligned to the same offset.

## Decision

Collapse only the final section to a single-column layout at widths up to 1100 px. Keep the section index as a normal full-width row, center the date/CTA inside the full shell, and let the meeting/map block occupy the full shell width.

Desktop above 1100 px keeps the current editorial two-column composition unchanged. Existing phone styles below 760 px stay intact.

## Why

The issue is structural, not a typography or map problem. Removing the tablet-only column offset fixes both the date and the map with the smallest possible CSS change and preserves the established desktop look.

## Mobile

At 390 px, the existing single-column layout remains the baseline. At 768–1100 px, the date must be visually centered in the shell and the map must use the full available content width without a left-column offset.

## Security

No data, auth, API, or Supabase changes.

## Out of scope

- Redesigning the final section.
- Changing the date copy, map provider, or CTA.
- Changing desktop layout above 1100 px.
