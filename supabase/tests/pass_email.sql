-- registrations exists only on the remote; a minimal stand-in with the columns this migration touches.
create table public.registrations (id uuid primary key default gen_random_uuid(), email text);

\ir ../migrations/20261007010000_pass_email.sql
\ir ../migrations/20261007010000_pass_email.sql

insert into public.registrations (email) values ('ana@example.com');
insert into public.pass_email_codes (registration_id, code_hash, expires_at)
select id, 'hash', now() + interval '10 minutes' from public.registrations;

do $$
begin
  assert exists (
    select 1 from information_schema.columns
    where table_name = 'registrations' and column_name = 'pass_emailed_at'
  ), 'pass_emailed_at must exist';
  assert (select relrowsecurity from pg_class where oid = 'public.pass_email_codes'::regclass),
    'RLS must be enabled on pass_email_codes';
  assert not has_table_privilege('anon', 'public.pass_email_codes', 'select'),
    'anon must not read pass_email_codes';
  delete from public.registrations;
  assert (select count(*) from public.pass_email_codes) = 0, 'codes must go with their registration';
end $$;
