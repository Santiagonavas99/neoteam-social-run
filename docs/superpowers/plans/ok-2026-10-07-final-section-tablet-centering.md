# Plan — Final section centering

Spec: `docs/superpowers/specs/2026-10-07-final-section-tablet-centering-design.md`

Branch: `fix/final-section-tablet-centering`

Approved by the user's follow-up on 2026-10-07 after the first breakpoint-only fix still showed the date and map shifted right.

1. **Remove the structural horizontal bias**
   - Update `app/home-v2.css`.
   - Make the final grid symmetric at desktop widths.
   - Keep the index in the left editorial zone while making the date/CTA span the full shell.
   - Make the meeting/map span the full shell.
   - At `max-width: 1100px`, return all three blocks to one-column document flow.
   - Verify 390 px, 768 px, 1024 px and laptop/desktop widths.

2. **Release 0.22.1**
   - Keep the existing `0.22.1` patch release entry in `CHANGELOG.md`.
   - Keep `package.json` at `0.22.1`.
   - Run CI and Vercel preview checks before merge.
