# Approved plan — Pending pass email batches

Spec: `docs/superpowers/specs/2026-10-08-pending-pass-emails-design.md`
Branch: `feat/admin-pending-pass-emails-20261008`
Approved by the user's explicit request to implement and create a PR, 2026-10-08.

1. Database compatibility: `supabase/migrations/20261008200000_pass_email_attempts.sql` + `supabase/tests/pass_email_queue.sql`. Add nullable last-attempt timestamp and safe last-error code; validate repeatable migration and RLS compatibility. No change to existing registered passes.
2. Backend: `supabase/functions/admin-pin/index.ts`, `supabase/functions/_shared/email.ts`, `supabase/functions/_shared/pass-email.ts`. Add admin-only queue list/send, conditional claim, Resend 429 detection, record latest error, exclude canceled, protect pending queue from existing manual resend, optional Resend idempotency header.
3. Admin: `features/admin/sections.ts`, `features/admin/admin-app.tsx`, `features/admin/participants/pending-emails-view.tsx`, `features/admin/types.ts`, a pure queue policy helper and unit tests. Build mobile 390px UI with counts, 25 earliest recipients and one-by-one manual sends up to 10 after confirmation, stop on error/quota. Existing checkin, participant list, resend unchanged for already sent.
4. Release: bump patch `package.json`, `CHANGELOG.md`. CI `pnpm ci:check`, SQL tests, and Vercel Preview. Create PR only; do **not** deploy database migration, Edge Function or main/production without user request.
