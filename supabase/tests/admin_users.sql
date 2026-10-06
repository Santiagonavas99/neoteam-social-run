\ir ../migrations/20261003220000_admin_pin_access.sql

insert into public.admin_pin_settings (id, pin_hash) values (1, 'pbkdf2$180000$c2FsdA==$aGFzaA==');
insert into public.admin_pin_sessions (token_hash, expires_at) values ('legacy', now() + interval '1 day');

\ir ../migrations/20261006150000_admin_users.sql
\ir ../migrations/20261006150000_admin_users.sql

do $$
begin
  assert (select count(*) from public.admin_users where username = 'admin' and role = 'admin'
    and pin_hash = 'pbkdf2$180000$c2FsdA==$aGFzaA==') = 1, 'shared PIN must become user admin';
  assert (select count(*) from public.admin_pin_sessions) = 0, 'sessions without a user must go';
  assert (select relrowsecurity from pg_class where oid = 'public.admin_users'::regclass),
    'RLS must be enabled on admin_users';
  assert not has_table_privilege('anon', 'public.admin_users', 'select'),
    'anon must not read admin_users';
  begin
    insert into public.admin_users (name, username, role, pin_hash) values ('X', 'Bad Name', 'admin', 'h');
    raise exception 'invalid username accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.admin_users (name, username, role, pin_hash) values ('Xy', 'staff', 'owner', 'h');
    raise exception 'invalid role accepted';
  exception when check_violation then null;
  end;
end $$;
