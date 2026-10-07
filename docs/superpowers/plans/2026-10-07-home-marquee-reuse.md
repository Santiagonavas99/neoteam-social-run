# Reuse allied brand logos in community marquees — plan

Spec: [home marquees spec](../specs/2026-10-07-home-crews-organizations-marquees-design.md) · Branch: `feat/home-crews-organizations-marquees` · Status: **awaiting user approval for this extension**

## Requested behavior

- Existing entries in `home_logo_carousel_items` remain managed in “Marcas aliadas”.
- Add independent admin switches to include each allied-logo entry in the “Running crews” strip, the “Organizaciones” strip, both, or neither.
- Reuse the saved logo, label/name, and link data; do not upload or configure a second copy.
- Keep adding extra crew-only entries through “Running crews”, and extra organization-only entries through “Marcas” with type “Organizador”. These entries must not appear in “Marcas aliadas”.
- Keep the homepage filters (active + visible on home) and ordering. A reused allied logo must also be active and visible on home to appear in a community strip.
- Avoid duplicate tiles within a strip when the same entity is present in both sources. Prefer a stable identity match based on normalized name and then logo URL, while preserving the native crew/organization record’s own tile if matched.
- Keep server-only Supabase reads and admin writes through the existing `/api/admin` → Edge Function path.

## Implementation tasks (after approval)

### 1. Add reuse configuration and admin controls

Files expected:
- New Supabase migration under `supabase/migrations/`
- Admin logo carousel types/forms/list and save API or Edge Function, wherever the existing logo carousel is managed
- Relevant tests

Changes:
- Add two non-null boolean fields to the existing allied logo carousel items, default false: include in running crews and include in organizations.
- Show corresponding checkboxes in the existing “Marcas aliadas” admin editor.
- Ensure existing rows default to neither community strip and retain all existing behavior.
- Do not apply the migration to a remote database.

Checks:
- Verify form defaults, editing, and serialization preserve each flag independently.
- Verify unauthenticated/public clients cannot write these fields.

### 2. Reuse selected entries on the homepage

Files expected:
- Existing home data loader, community marquee selector, homepage, and selector tests

Changes:
- Load configured allied logo entries server-side and merge them into the requested strip only when their respective switch, active, and show-on-home are true.
- Preserve the existing crew list from “Running crews” and organizations from “Marcas” (type “Organizador”); continue allowing additional records there without making them allies.
- Deduplicate cross-source representations within each strip using the identity rule above, preserving the native record when a match exists.
- Keep sort order deterministic across merged sources and retain links/name fallback behavior.

Checks:
- Unit tests cover each flag independently, filters, ordering, deduplication, and unrelated brands excluded from organizations.
- Verify mobile and desktop marquees and admin editing.

### 3. Release and verification

- Add a migration and feature notes; choose the next project version based on the current branch tip rather than reusing the prior 0.17.0 release.
- Run `pnpm ci:check` and review the deployment preview if available.
- No PR, merge to `main`, or production deployment unless the user separately asks.

## Out of scope

- Changing the existing “Running crews” or “Marcas” data models.
- Copying logos or adding duplicate records just to reuse an allied brand.
- New admin sections, auth changes, or direct Supabase access from the browser.
