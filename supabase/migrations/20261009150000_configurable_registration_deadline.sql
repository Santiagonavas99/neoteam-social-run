-- The registration cutoff is stored in the event, not in app source code.
-- The fixed October 10 deadline is replaced by Saturday October 17, 20:00 Colombia time.
alter table public.events add column if not exists registration_deadline timestamptz;

update public.events
set registration_deadline = timestamptz '2026-10-17 20:00:00-05:00'
where code = 'SR26'
  and (registration_deadline is null
    or registration_deadline = timestamptz '2026-10-10 20:00:00-05:00');

create or replace function public.sr26_accepts_registration_at(p_now timestamptz)
returns boolean
language sql stable security definer
set search_path to ''
as $$
  select coalesce((
    select e.registration_open is true
      and e.status in ('published','draft')
      and (e.registration_deadline is null or p_now < e.registration_deadline)
    from public.events e where e.code = 'SR26' limit 1
  ), false);
$$;

create or replace function public.enforce_sr26_registration_deadline()
returns trigger
language plpgsql security definer
set search_path to ''
as $$
begin
  if exists (select 1 from public.events e where e.id = new.event_id and e.code = 'SR26')
    and not public.sr26_accepts_registration_at(clock_timestamp()) then
    raise exception 'INSCRIPCIONES_CERRADAS';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_sr26_registration_deadline on public.registrations;
create trigger enforce_sr26_registration_deadline
before insert on public.registrations
for each row execute function public.enforce_sr26_registration_deadline();

-- Public, read-only status for the website. Do not expose events or staff metadata.
create or replace function public.get_sr26_registration_settings()
returns table (deadline timestamptz, registration_open boolean)
language sql stable security definer
set search_path to ''
as $$
  select e.registration_deadline,
    (e.registration_open is true and e.status in ('published','draft')) as registration_open
  from public.events e where e.code = 'SR26' limit 1;
$$;

revoke all on function public.get_sr26_registration_settings() from public;
grant execute on function public.get_sr26_registration_settings() to anon, authenticated, service_role;
