# Plan — Home section visibility

Branch: `feat/home-section-visibility`

Approved by the user's instruction on 2026-10-07.

1. **Database visibility flag**
   - Add `visible boolean not null default true` to `public.home_section_order`.
   - Preserve all current rows as visible.
   - Verify stored values and security advisors.

2. **Domain model + Home rendering**
   - Extend `HomeSectionOrder` and normalization with `visible`.
   - Read the flag from Supabase.
   - Filter hidden sections before editorial numbering/rendering.
   - Add tests for default visibility and hidden rows.

3. **Admin control**
   - Add Visible/Oculta control to each section card using `Eye` / `EyeOff`.
   - Keep arrow ordering unchanged.
   - Save visibility together with order through `admin-pin`.

4. **Release 0.22.0**
   - Update `CHANGELOG.md`.
   - Bump `package.json` to `0.22.0`.
   - Verify Vercel preview/build before merge or production.
