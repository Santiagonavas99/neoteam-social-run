\ir ../migrations/20261003220000_admin_pin_access.sql

insert into public.admin_pin_sessions (token_hash, expires_at) values ('legacy', now() + interval '1 day');

\ir ../migrations/20261006150000_admin_users.sql
\ir ../migrations/20261006150000_admin_users.sql

insert into public.admin_users (name, email, role) values ('Ana', 'ana@example.com', 'admin');
insert into public.admin_login_codes (user_id, code_hash, expires_at)
select id, 'hash', now() + interval '10 minutes' from public.admin_users;

do $$
begin
  assert (select count(*) from public.admin_pin_sessions) = 0, 'sessions without a user must go';
  assert (select relrowsecurity from pg_class where oid = 'public.admin_users'::regclass),
    'RLS must be enabled on admin_users';
  assert (select relrowsecurity from pg_class where oid = 'public.admin_login_codes'::regclass),
    'RLS must be enabled on admin_login_codes';
  assert not has_table_privilege('anon', 'public.admin_users', 'select'),
    'anon must not read admin_users';
  assert not has_table_privilege('anon', 'public.admin_login_codes', 'select'),
    'anon must not read admin_login_codes';
  begin
    insert into public.admin_users (name, email, role) values ('Bea', 'Bea@Example.com', 'admin');
    raise exception 'uppercase email accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.admin_users (name, email, role) values ('Bea', 'not-an-email', 'admin');
    raise exception 'invalid email accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.admin_users (name, email, role) values ('Bea', 'bea@example.com', 'owner');
    raise exception 'invalid role accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.admin_users (name, email, role) values ('Ana 2', 'ana@example.com', 'checkin');
    raise exception 'duplicate email accepted';
  exception when unique_violation then null;
  end;
  delete from public.admin_users where email = 'ana@example.com';
  assert (select count(*) from public.admin_login_codes) = 0, 'codes must go with their user';
end $$;
