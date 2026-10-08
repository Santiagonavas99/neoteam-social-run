# Participant management PR #73 — QA audit (2026-10-08)

Branch: `feat/admin-participants-filters-edit-20261008`

## Implemented
- Server-side query filtering for crew / gender / pass email state / ordering, preserving 25-row pages and original CSV backup.
- Existing admin list displays more useful contact and pass information, with an editable profile panel.
- Admin-only profile correction action validates details; metadata audit and optimistic locking are implemented by an additive SQL migration.
- Email correction marks its pass as pending, without issuing email or resetting the QR.

## Verified
- GitHub SQL tests passed on branch CI (new metadata-only audit migration re-run and transactional update test).
- Vercel preview built successfully.
- Frontend formatting errors have been addressed.
- No production Supabase migration, Edge Function update or real registration mutation was performed.

## Blocking validation
- At last run, `pnpm ci:check` failed at Biome lint/format in `supabase/functions/admin-pin/index.ts`.
- The change is formatting and import-order only; patching this sensitive server file via the available GitHub connector was blocked at the write/commit stage.
- **Do not merge** until an authorized maintainer runs `pnpm lint:fix`, commits the resulting changes on this branch and reruns full CI.
- Typecheck, unit tests and Next.js build cannot be counted as passed by GitHub CI while lint exits early.

## Release order after CI
1. Apply `supabase/migrations/20261008194500_participant_profile_editor.sql`.
2. Deploy the updated `admin-pin` function including its new shared validation/TLD files.
3. Verify filters in preview, and test corrections with an explicitly authorized non-real test participant.
4. Obtain user approval for merge to `main` and production rollout.

## Security observations
- The SQL function is `SECURITY DEFINER`, sets `search_path = ''` and is only executable by `service_role`.
- Audit stores only field names, participant ID, editor ID and timestamp.
- Browser never receives privileged Supabase credentials.
- Admin corrections require an authenticated admin session; optimistic version check blocks stale writes.
