create table if not exists public.home_logo_carousel_items (
  id uuid primary key default gen_random_uuid(),
  event_code text not null default 'SR26',
  name text not null,
  logo_url text not null default '',
  link_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_logo_carousel_items_name_check check (char_length(trim(name)) between 1 and 120)
);

create index if not exists home_logo_carousel_items_event_active_sort_idx
  on public.home_logo_carousel_items (event_code, active, sort_order, created_at);

alter table public.home_logo_carousel_items enable row level security;

revoke all on table public.home_logo_carousel_items from anon, authenticated;
grant select on table public.home_logo_carousel_items to anon, authenticated;
grant select, insert, update, delete on table public.home_logo_carousel_items to service_role;

drop policy if exists "Public can read active home carousel logos" on public.home_logo_carousel_items;
create policy "Public can read active home carousel logos"
  on public.home_logo_carousel_items
  for select
  to anon, authenticated
  using (active = true);
