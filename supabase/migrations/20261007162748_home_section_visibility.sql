alter table public.home_section_order
  add column if not exists visible boolean not null default true;
