-- Existing items remain brands. Races share the secure logo store while
-- keeping their own selection, ordering and visibility.
alter table public.home_logo_carousel_items
  add column if not exists carousel_kind text not null default 'brand';

alter table public.home_logo_carousel_items
  drop constraint if exists home_logo_carousel_kind_check;

alter table public.home_logo_carousel_items
  add constraint home_logo_carousel_kind_check
  check (carousel_kind in ('brand', 'race'));

create index if not exists home_logo_carousel_kind_event_sort_idx
  on public.home_logo_carousel_items
  (event_code, carousel_kind, active, sort_order, created_at);

alter table public.home_section_order
  drop constraint if exists home_section_order_key_check;

alter table public.home_section_order
  add constraint home_section_order_key_check check (
    section_key in (
      'story', 'steps', 'numbers', 'allies', 'races', 'running_crews',
      'organizations', 'agenda', 'community', 'raffle', 'final', 'landak_studio'
    )
  );

-- Tie with Running crews preserves saved order and the front-end breaks the
-- tie in the editorial default sequence: brands, races, crews.
insert into public.home_section_order (event_code, section_key, sort_order, visible)
values ('SR26', 'races', 4, true)
on conflict (event_code, section_key) do nothing;
