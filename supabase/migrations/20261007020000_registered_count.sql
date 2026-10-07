-- Public aggregate for the home page: how many runners registered for SR26 (cancelled excluded).
-- Returns only a number; the anon key still cannot read registrations.
create or replace function public.social_run_registered_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.registrations r
  join public.events e on e.id = r.event_id
  where e.code = 'SR26' and r.status <> 'cancelled'
$$;

revoke all on function public.social_run_registered_count() from public;
grant execute on function public.social_run_registered_count() to anon, authenticated;
