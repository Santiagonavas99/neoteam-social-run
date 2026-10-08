# Plan — participant filters and editable profiles

Spec: `docs/superpowers/specs/2026-10-08-admin-participants-filters-edit-design.md`
Branch: `feat/admin-participants-filters-edit-20261008`
Status: **approved by the user on 2026-10-08**.

1. **Backend filters.** `supabase/functions/admin-pin/index.ts`: extend only the existing opt-in `participants/list/paginated` endpoint with whitelisted crew, gender, email pass status and sorting. Keep status totals and full CSV backup intact. Add database indexes only if query analysis warrants them. Verify combinations, empty results, pagination and max 25 rows.

2. **Profile read/edit and validation.** `supabase/functions/admin-pin/index.ts`, optional helper under `supabase/functions/_shared/` and corresponding tests: include necessary fields in participants list, fetch active crew options, add a dedicated `updateParticipantProfile` action. Validate fields server-side, check UUID/event, expected `updated_at`, group ID, birth dates and duplicates. Preserve QR, legal consent and attendance. On *changed email only*, mark pass pending, without sending. If tracking editor identity requires a small additive SQL table, include an explicit migration and SQL tests (metadata-only audit, not full PII copies).

3. **Admin UI.** `features/admin/participants/participants-view.tsx`, `features/admin/participants/participant-editor.tsx` (new), `features/admin/types.ts`, pure form validation helper/tests: compact list with email/contact visibility, new filter selects and clearing, improved expanded details; accessible edit panel with Save/Cancel, inline error feedback, post-save reload preserving current filters. Keep check-in, resend, deletion and backup.

4. **Release.** `CHANGELOG.md`, `package.json`: next available minor version. Run `pnpm ci:check`, SQL tests where applicable, Vercel preview. Test mobile at 390px before 1440px (filters, long names, edit workflow, error/success, keyboard). Create PR only after user approval; do not merge/deploy without another request.

### Acceptance criteria
- Filter Neo Team + registered + pass pending shows correct server total and 25-row paging.
- Sorting and search work across *all* registrations even from page 2.
- Correcting phone/name preserves QR, status, and pass-sent state.
- Correcting email moves the participant into the unsent queue, without auto-sending.
- Duplicate event email/document, invalid numbers/domains/date, and concurrent edit return useful errors without overwriting data.
- CSV remains complete and unfiltered; existing check-in/re-send/delete keep working.
