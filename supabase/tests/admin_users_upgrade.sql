\ir ../migrations/20261003220000_admin_pin_access.sql

-- The PIN-based shape that ran on the remote before the email sign-in.
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  role text not null check (role in ('admin', 'checkin')),
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_pin_sessions
  add column user_id uuid references public.admin_users(id) on delete cascade;
insert into public.admin_users (name, username, role, pin_hash) values ('Admin', 'admin', 'admin', 'h');

\ir ../migrations/20261006150000_admin_users.sql
\ir ../migrations/20261007003000_admin_users_email.sql
\ir ../migrations/20261007003000_admin_users_email.sql

insert into public.admin_users (name, email, role) values ('Ana', 'ana@example.com', 'admin');

do $$
begin
  assert (select count(*) from public.admin_users) = 1, 'PIN accounts must be gone';
  assert not exists (
    select 1 from information_schema.columns
    where table_name = 'admin_users' and column_name in ('username', 'pin_hash')
  ), 'PIN columns must be gone';
  assert to_regclass('public.admin_login_codes') is not null, 'codes table must exist';
  assert not has_table_privilege('anon', 'public.admin_login_codes', 'select'),
    'anon must not read admin_login_codes';
  begin
    insert into public.admin_users (name, email, role) values ('Bea', 'Bea@Example.com', 'admin');
    raise exception 'uppercase email accepted';
  exception when check_violation then null;
  end;
end $$;
