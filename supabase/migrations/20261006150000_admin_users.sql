create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  username text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  role text not null check (role in ('admin', 'checkin')),
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_pin_sessions
  add column if not exists user_id uuid references public.admin_users(id) on delete cascade;

create index if not exists admin_pin_sessions_user_id_idx
  on public.admin_pin_sessions(user_id);

-- The shared PIN becomes the first admin, so the current owner keeps access.
insert into public.admin_users (name, username, role, pin_hash)
select 'Admin', 'admin', 'admin', pin_hash
from public.admin_pin_settings
where id = 1 and not exists (select 1 from public.admin_users)
on conflict (username) do nothing;

delete from public.admin_pin_sessions where user_id is null;

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
