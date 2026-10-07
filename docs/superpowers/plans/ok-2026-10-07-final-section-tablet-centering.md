# Plan — Final section tablet centering

Spec: `docs/superpowers/specs/2026-10-07-final-section-tablet-centering-design.md`

Branch: `fix/final-section-tablet-centering`

Approved by the user's request on 2026-10-07 to fix the date and map alignment on smaller screens.

1. **Fix intermediate responsive layout**
   - Update `app/home-v2.css`.
   - At `max-width: 1100px`, collapse `.v2-final-grid` to one column and reset `.v2-meeting` to the first column.
   - Keep `.v2-final-main` centered and full width.
   - Verify 390 px, 768 px, 1024 px, and desktop >1100 px behavior.

2. **Release 0.22.1**
   - Add the fix under `Fixed` in `CHANGELOG.md`.
   - Bump `package.json` to `0.22.1`.
   - Run CI and Vercel preview checks before merge.
