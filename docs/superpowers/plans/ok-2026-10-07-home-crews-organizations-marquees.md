# Home crews and organizations marquees — plan

Spec: [`2026-10-07-home-crews-organizations-marquees-design.md`](../specs/2026-10-07-home-crews-organizations-marquees-design.md) · Branch: `feat/home-crews-organizations-marquees` (from `main`) · Status: **approved** (user, 2026-10-07)

## Tasks

### 1. `feat(home): add crew and organization marquees`

Files:
- `app/page.tsx`
- `features/home/data.ts`
- `features/home/logo-marquee.tsx`
- `features/home/sections/community.tsx`
- `features/admin/community/community-view.tsx`
- `features/admin/community/community-form.tsx`
- `features/admin/sections.ts`

Changes:
- Reuse existing server-loaded groups and brands to feed separate crew and organizer marquees.
- Generalize the current marquee for a title, accessible section ID, logo or name fallback, and available website/Instagram links.
- Keep sponsors and partners in the lower community section while removing the groups and organizers shown by their dedicated marquees.
- Make the existing admin destinations and visibility controls clear for crews and organizations.

Checks:
- Inspect changes for correct Supabase filters and server-only data access.
- Run the mobile-first check at 390 px, then desktop at 1440 px.
- Verify links, name fallbacks, marquee pause and reduced-motion behavior.

### 2. `test(home): cover community marquee selection`

Files:
- `features/home/community-marquees.ts`
- `features/home/community-marquees.test.ts`
- `app/page.tsx`

Changes:
- Add a small pure selector that maps running groups and organizer brands to marquee items, preserving order and link details.
- Keep non-organizer brands out of the organization strip.

Checks:
- Run the new focused test and `pnpm test`.

### 3. `chore(release): 0.17.0`

Files:
- `CHANGELOG.md`
- `package.json`

Changes:
- Add the feature to the release notes and bump the minor version as required for a feature release.

Checks:
- Run `pnpm ci:check` (lint, typecheck, tests, build).
- Check that the release heading and package version both read `0.17.0`.

No PR or production deployment is part of this plan.
