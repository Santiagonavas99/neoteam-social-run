alter table public.home_section_order
  drop constraint if exists home_section_order_key_check;

alter table public.home_section_order
  add constraint home_section_order_key_check check (
    section_key in (
      'story',
      'numbers',
      'allies',
      'running_crews',
      'organizations',
      'agenda',
      'community',
      'raffle',
      'final',
      'landak_studio'
    )
  );

insert into public.home_section_order (event_code, section_key, sort_order, visible)
select
  'SR26',
  'landak_studio',
  least(coalesce(max(sort_order), 0) + 1, 999),
  true
from public.home_section_order
where event_code = 'SR26'
on conflict (event_code, section_key) do nothing;
