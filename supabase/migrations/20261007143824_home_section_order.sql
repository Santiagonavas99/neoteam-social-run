create table if not exists public.home_section_order (
  event_code text not null,
  section_key text not null,
  sort_order integer not null,
  updated_at timestamptz not null default now(),
  primary key (event_code, section_key),
  constraint home_section_order_key_check check (
    section_key in (
      'story',
      'numbers',
      'allies',
      'running_crews',
      'organizations',
      'agenda',
      'community',
      'raffle',
      'final'
    )
  ),
  constraint home_section_order_sort_check check (sort_order between 1 and 999)
);

create index if not exists home_section_order_event_sort_idx
  on public.home_section_order (event_code, sort_order, section_key);

alter table public.home_section_order enable row level security;

revoke all on table public.home_section_order from anon, authenticated;
grant select on table public.home_section_order to anon, authenticated;
grant select, insert, update, delete on table public.home_section_order to service_role;

drop policy if exists "Public home section order is readable" on public.home_section_order;
create policy "Public home section order is readable"
  on public.home_section_order
  for select
  to anon, authenticated
  using (event_code = 'SR26');

insert into public.home_section_order (event_code, section_key, sort_order)
values
  ('SR26', 'story', 1),
  ('SR26', 'numbers', 2),
  ('SR26', 'allies', 3),
  ('SR26', 'running_crews', 4),
  ('SR26', 'organizations', 5),
  ('SR26', 'agenda', 6),
  ('SR26', 'community', 7),
  ('SR26', 'raffle', 8),
  ('SR26', 'final', 9)
on conflict (event_code, section_key) do nothing;
