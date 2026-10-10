-- One shared upload can be displayed in several marquees without duplicating a record.
alter table public.home_logo_carousel_items
  add column if not exists show_in_races boolean not null default false;

create index if not exists home_logo_reused_in_races_idx
  on public.home_logo_carousel_items (event_code, carousel_kind, sort_order, created_at)
  where active = true and show_in_races = true;
