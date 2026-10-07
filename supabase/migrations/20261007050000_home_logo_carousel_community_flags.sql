alter table public.home_logo_carousel_items
  add column if not exists show_in_running_crews boolean not null default false,
  add column if not exists show_in_organizations boolean not null default false;
