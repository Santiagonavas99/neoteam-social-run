-- Safe operational metadata for retrying participant pass emails from the admin.
-- pass_emailed_at remains the existing source of truth for Resend-accepted submissions.
alter table public.registrations
  add column if not exists pass_email_last_attempt_at timestamptz,
  add column if not exists pass_email_last_error text;

comment on column public.registrations.pass_email_last_attempt_at is
  'Timestamp of the last manual pass email send attempt';
comment on column public.registrations.pass_email_last_error is
  'Safe provider/error code from the last failed manual attempt; never a raw provider response';
