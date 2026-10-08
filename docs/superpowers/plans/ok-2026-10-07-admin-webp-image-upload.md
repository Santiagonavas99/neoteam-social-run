# Admin WebP uploads — implementation plan

Spec: `docs/superpowers/specs/2026-10-07-admin-webp-image-upload-design.md`
Branch: `feat/admin-webp-image-uploads` from main 2026-10-07.
Scope limited to admin image upload, documentation and release.

## Task 1 — Shared browser conversion

- Add `features/admin/ui/image-processing.ts` with raster validation, max original size, proportional resize, WebP encoding, adaptive compression, alpha preservation, codec failure handling and a strict final 4 MiB check.
- Add `features/admin/ui/image-processing.test.ts` for input and resize rules.
- Update `features/admin/ui/image-upload-field.tsx` to process first, encode resulting WebP into base64 and submit the existing `uploadAdminImage` action with `mime: 'image/webp'`. Preserve callbacks/locked state and show savings.
- Update format/help text in `features/admin/logos/logo-form.tsx` and `features/admin/community/community-form.tsx`.
- Check: unit tests; manual 390 px first, then 1440 px; show success/error and ensure field locks while processing.
- Commit: `feat(admin): convert image uploads to compressed WebP`

## Task 2 — Release

- Update `CHANGELOG.md` with a user-visible Added note.
- Set `package.json` version to 0.28.0 (minor feature release after 0.27.0).
- Run `pnpm ci:check` (lint, types, tests, build); verify no unrelated files changed. CI and a preview must pass before merge.
- Commit: `chore(release): 0.28.0`

## Out of scope

No edge function deployment, schema, proxy, existing image migration, public UI redesign, PIN/auth, registration, Wallet or check-in changes.
