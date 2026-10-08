-- Stand-in schema: production registrations are not created by repo migrations.
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  pass_emailed_at timestamptz
);

\ir ../migrations/20261008200000_pass_email_attempts.sql
\ir ../migrations/20261008200000_pass_email_attempts.sql

insert into public.registrations (pass_email_last_attempt_at, pass_email_last_error)
values (now(), 'rate_limited');

do $$
begin
  assert exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registrations'
      and column_name = 'pass_email_last_attempt_at'
  ), 'attempt timestamp missing';
  assert exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registrations'
      and column_name = 'pass_email_last_error'
  ), 'error code missing';
  assert (select pass_email_last_error from public.registrations limit 1) = 'rate_limited',
    'last-error code should persist';
end $$;
