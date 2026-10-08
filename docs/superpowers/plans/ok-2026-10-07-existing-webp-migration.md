# Existing-logo WebP conversion — implementation plan

Spec: `docs/superpowers/specs/2026-10-07-existing-webp-migration-design.md`
Branch: `feat/admin-webp-image-uploads` (extends PR #58, requested 2026-10-07).

## Task 1 — Controlled migration utility

- Refactor `features/admin/ui/image-upload-field.tsx` to export `uploadWebpImage(blob)`, reusing the same gzip/admin endpoint that works for new uploads.
- Add `features/admin/logos/existing-image-migration.ts` with strict hosted-object eligibility, community slug preflight, output summaries and sequential migration of existing rows. Do not delete originals.
- Add `features/admin/logos/existing-image-migration.test.ts` for filtering, slug checks and safe skips.
- Check: relevant unit tests; no auth/database/server modifications.
- Commit: `feat(admin): safely migrate existing logo references to WebP`.

## Task 2 — Explicit admin confirmation UI

- Update `features/admin/logos/logos-view.tsx` with a compact button, confirmation showing candidate count, progress, success/error count and a reload after finishing. Disable conflicting admin controls while running.
- Check: mobile 390px first, then desktop; ensure cancel leaves records unchanged and partial failures preserve original URL.
- Commit: `feat(admin): add confirmed bulk WebP optimization action`.

## Task 3 — Docs and verification

- Update `CHANGELOG.md` under the existing 0.28.0 release (same feature PR).
- Re-run GitHub CI (Biome, TypeScript, tests, build and SQL). Keep `main` and the live production database unchanged until a real admin confirms the migration via the UI.
- Check: PR Preview in Vercel, render and manual test of one known image before executing all.
- Commit: `docs(release): record existing image migration`.

## Out of scope

No deletion of original Storage objects, no conversion of unrelated orphaned bucket objects (four currently), external URLs or bundled static logo assets, no SQL or API schema changes, no automatic background jobs.

## Task 4 — One-time production-only visibility (follow-up approved in chat 2026-10-07)

- `app/admin/page.tsx`: pass the server-derived production deployment flag to `AdminApp`.
- `features/admin/admin-app.tsx`: pass the flag only to the logos screen; no changes to other sections.
- `features/admin/logos/logos-view.tsx`: query remaining eligible URLs when the screen mounts in production; don't show the button while checking, in Preview, after all URLs become WebP, or during the confirmed migration. Recheck remaining files after migration; allow retry on partial failures.
- `features/admin/logos/migration-guards.ts` and `.test.ts`: pure visibility rule and cases for production/preview/unknown/zero/positive counts.
- `CHANGELOG.md`: describe the one-time behavior.
- Checks: `pnpm ci:check`, SQL, Preview deployment. Do not execute the migration on live Supabase.
- Commit: `feat(admin): retire WebP migration button when backlog is empty`.
