# Reuse allied brand logos in community marquees — plan

Spec: [home marquees spec](../specs/2026-10-07-home-crews-organizations-marquees-design.md) · Branch: `feat/home-crews-organizations-marquees` · Status: **approved by user, 2026-10-07**

## Requested behavior

- Existing entries in `home_logo_carousel_items` remain managed in “Marcas aliadas”.
- Add independent admin switches to include each allied-logo entry in the “Running crews” strip, the “Organizaciones” strip, both, or neither.
- Reuse the saved logo, name, and link data; do not upload or configure a second copy.
- Extra crew-only entries remain in “Running crews”; extra organization-only entries remain in “Marcas” with type “Organizador”.
- A reused allied entry needs its include switch and existing `active` visibility control enabled to appear in a community strip.
- Deduplicate cross-source representations within each strip by normalized name, falling back to normalized logo URL; if matched, preserve the native crew/organization tile.
- Keep server-only Supabase reads and admin writes through the existing `/api/admin` → Edge Function path.

## Tasks

### 1. `feat(admin): configure allied logo reuse`

Files:
- `supabase/migrations/20261007050000_home_logo_carousel_community_flags.sql`
- `features/admin/types.ts`
- `features/admin/logos/logo-form.tsx`
- `features/admin/logos/logos-view.tsx`
- `supabase/functions/admin-logos/index.ts`

Changes:
- Add two non-null boolean columns with false defaults: `show_in_running_crews`, `show_in_organizations`.
- Add two independent checkboxes in each allied-logo form.
- Include flags in the list and save payloads; preserve false defaults for new and existing rows.
- Keep public writes unavailable; the admin Edge Function is the only write path.

Checks:
- Verify both switches serialize and can be saved independently.
- Review the migration's RLS/grants; do not apply it to remote Supabase.

### 2. `feat(home): merge selected allies into community marquees`

Files:
- `features/home/data.ts`
- `features/home/community-marquees.ts`
- `features/home/community-marquees.test.ts`
- `app/page.tsx`

Changes:
- Load active allied logo items with both flags server-side.
- Merge selected entries into native crew and organizer items only when active and the relevant include switch are true.
- Preserve native crews and `brands.type = 'organizer'`; extra native records remain exclusive to their section.
- Deduplicate by normalized name, then logo URL, preserving native details and stable sort order.

Checks:
- Cover independent flags, active filters, ordering, deduplication, and exclusion of non-organizer brands.
- Verify at 390 px before desktop; check logo/name fallback and links.

### 3. `chore(release): 0.18.0`

Files:
- `CHANGELOG.md`
- `package.json`

Changes:
- Add the reuse behavior to Unreleased and bump the minor version to 0.18.0.

Checks:
- Run `pnpm ci:check` and review the preview if available.
- No PR, merge to `main`, remote migration application, or production deployment unless separately requested.

## Out of scope

- Changing the existing “Running crews” or “Marcas” data models.
- Copying logos or adding duplicate records just to reuse an ally.
- New admin sections, auth changes, or direct Supabase access from the browser.

## Corrective follow-up — 2026-10-07

User explicitly requested restoring Marcas aliadas without another approval gate.

- Fix `features/home/data.ts` to retry the existing columns only when the optional reuse columns are absent; default inclusion flags to false. Preserve active/event/order filters and all three strips.
- Verify migrated and unmigrated responses, unrelated errors, existing selector tests, and the preview build. No schema or UI changes.
