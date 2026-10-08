# Design — Pending pass emails in NeoTeam admin

## Problem
The free Resend plan has a daily mail quota shared by participant passes, administrator sign-in codes, and manual resends. Failed pass deliveries leave `registrations.pass_emailed_at` null. Administrators need to find those active registrations and send the remaining passes manually in later batches.

## Decision
Add an admin-only **Correos pendientes** section. The queue represents SR26 registrations with `pass_emailed_at IS NULL`, `status <> 'cancelled'`. The API returns queue totals and only the 25 oldest unsent registrations, ordered by `created_at` then `registration_number`. It never ranks participants by an arbitrary first 100 or assumes the 100 mail/day allotment is dedicated to passes.

Send requires explicit confirmation in the UI and runs serially (one recipient per authenticated API request), max 10 attempts per confirmation. Each attempted send uses an atomic conditional update of `pass_emailed_at` as a send reservation: only one caller can claim a pending registration. On provider rejection the reservation is released and a safe error code / last attempt timestamp persisted. HTTP 429 stops the batch; any other failure stops rather than blindly retrying. Resend idempotency key, scoped to a registration's confirmation mail, minimizes ambiguous retry duplicates.

The existing `registered` signup path also uses `pass_emailed_at IS NULL` to claim its sends; existing explicit resend stays available for *already sent* passes, while unsent passes go through the queue to avoid racing with the batch.

## Interaction and visual direction
- NeoTeam admin's existing black/cyan Host Grotesk design, neutral cards, no new global CSS.
- Phone-first 390px: a large queue total, two compact accepted/failure figures, a short note about Resend's shared daily limit, an ordered name/email list, and an obvious **Enviar tanda** control with a confirmation state.
- During send: progress `Enviando 3 de 10`, actionable completion/failure feedback, buttons disabled.
- After send: reload counters and queue. Empty state means no passes pending.
- At 1440px the layout is wider but uses the same reading order. Controls are keyboard-operable and ≥44px.

## Security
- The browser never queries Supabase. Only the admin Edge Function, using existing admin session + role guard, can list recipients or send.
- No sensitive credentials, raw provider response or email addresses in logs. List limited to 25 rows.
- Canceled registrations excluded. No new public RPC privileges.
- Provider 429 is shown as a safe `rate_limited` reason; no automatic scheduling or nighttime sending.
- Resend accepting an email is not proof of inbox delivery, so UI says `Aceptados por Resend`, not `Entregados`.

## Alternatives rejected
- Treat participant #101 onward as pending: signup emails and daily quotas are unrelated to participant number.
- Fire 100 concurrent requests: throttling, duplicates and 30-second proxy timeouts.
- Browser-to-Resend or browser-to-Supabase: exposes credentials and PII.

## Deployment notes
Database additive migration first, updated `admin-pin` Edge Function second, Next.js/Vercel frontend last. Avoid deploying the Edge Function to live until the user expressly requests production. CI can validate code without sending real messages.
