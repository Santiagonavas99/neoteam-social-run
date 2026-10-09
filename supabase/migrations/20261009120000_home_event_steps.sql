-- Add the QR check-in walkthrough to the configurable homepage without reordering any
-- existing admin-managed sections or exposing participant details.
alter table public.home_section_order
  drop constraint if exists home_section_order_key_check;

alter table public.home_section_order
  add constraint home_section_order_key_check check (
    section_key in (
      'story', 'steps', 'numbers', 'allies', 'running_crews',
      'organizations', 'agenda', 'community', 'raffle', 'final', 'landak_studio'
    )
  );

-- The new section is positioned immediately after Story when normalized. Existing
-- editorial order and visibility decisions are intentionally preserved.
insert into public.home_section_order (event_code, section_key, sort_order, visible)
values ('SR26', 'steps', 2, true)
on conflict (event_code, section_key) do nothing;
