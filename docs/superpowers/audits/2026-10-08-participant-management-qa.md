# Participant management PR #73 — QA audit (2026-10-08)

Branch: `feat/admin-participants-filters-edit-20261008`

## Implemented
- Server-side query filtering for crew / gender / pass email state / ordering, preserving 25-row pages and original CSV backup.
- Existing admin list displays more useful contact and pass information, with an editable profile panel.
- Admin-only profile correction action validates details; metadata audit and optimistic locking are implemented by an additive SQL migration.
- Email correction marks its pass as pending, without issuing email or resetting the QR.

## Verified
- GitHub Actions run `37835438331` passed **Lint + Typecheck + Tests + Build** and **SQL tests**.
- The mobile-friendly Vercel preview built successfully.
- Running crews now load from the existing `adminData/groups/list` endpoint. The live database contains 11 running groups, so there is no dependency on an undeployed participant-options operation.
- No production Supabase migration, Edge Function update or real registration mutation was performed.

## Remaining rollout validation
- CI formatting and import ordering issues are resolved.
- Before enabling the edit and server-filter actions for users, apply the additive migration and deploy the corresponding authenticated Edge Function. The preview's current list works with the existing backend; its new server filters and save action need that compatible backend.
- An authenticated end-to-end check of the new crew filters and editing workflow has **not** been performed; no test changes have been made to real participant records.
- Do not merge or publish to production without the requested release validation.

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
