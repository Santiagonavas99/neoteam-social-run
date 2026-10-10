-- Track only authenticated admin panel tabs. No visitor tracking or staff emails.
-- A tab counts as online if its heartbeat and most recent interaction are fresh.
create table if not exists public.admin_online_tabs (
  session_id uuid not null references public.admin_pin_sessions(id) on delete cascade,
  tab_id uuid not null,
  user_id uuid not null references public.admin_users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  primary key (session_id, tab_id)
);

create index if not exists admin_online_tabs_seen_idx
  on public.admin_online_tabs (last_seen_at desc);
create index if not exists admin_online_tabs_user_idx
  on public.admin_online_tabs (user_id, last_active_at desc);

alter table public.admin_online_tabs enable row level security;
revoke all on public.admin_online_tabs from anon, authenticated;
