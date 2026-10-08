# Two-column CommunityConnect on desktop — design

Date: 2026-10-08
Branch: `fix/desktop-community-connect-columns`
Release: 0.29.1

## Problem
The "SIGAMOS CONECTADOS" community call-to-action appears below the QR pass confirmation in a centered narrow column. On widescreen desktops it leaves unnecessary unused horizontal space while WhatsApp and Instagram buttons occupy the entire narrow column.

## Approved design direction
The user supplied a desktop screenshot and asked for the block in two columns.
- **Left:** eyebrow "SIGAMOS CONECTADOS", heading "La comunidad sigue corriendo." and supporting sentence, grouped as one unit.
- **Right:** WhatsApp and Instagram links stacked vertically and matched in width, using the existing cyan primary and subdued secondary styles.
- **Phone/tablet:** preserve the current single column at 390px and narrow widths, retaining the 360px maximum and center alignment. Switch only at `lg` (1024px), where the registration shell has room.
- Keep the entire block visually aligned with the parent pass confirmation card; unlock `max-w-90` only on desktop. Use an intentionally slightly wider actions column, minmax tracks to prevent overflow, and maintain the current `mt-9` spacing beneath the pass.

## Constraints
The component is shared by successful registration and pass recovery. Do not change WhatsApp/Instagram destinations, copy, colors, icon sources, URLs, button order, keyboard behavior, data operations, Supabase, or pass logic. No new dependencies. Preserve ≥44px hit areas and accessible link labels. Leverage Tailwind's existing breakpoint/utilities and `--neo-*` tokens.

## Design alternative rejected
Side-by-side buttons in one column or a 2-column layout from tablet width would make the long Instagram handle crowded and undermine the clear primary/secondary CTA hierarchy.

## QA
Check 390px and 430px mobile (single column); ~800px tablet (single column); 1024px and 1440px desktop (two columns, no overlap/overflow) on both registration success and pass recovery. CI: Biome, TypeScript, tests, build and SQL.
