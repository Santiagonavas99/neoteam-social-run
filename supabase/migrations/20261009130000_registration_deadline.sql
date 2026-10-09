-- SR26 registration closes at 2026-10-10 20:00 America/Bogota (UTC-05:00).
-- Trigger guards inserts from the public RPC as well as any other database writer.
-- Existing participants may still recover passes and receive updates after the deadline.
create or replace function public.sr26_accepts_registration_at(p_now timestamptz)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select p_now < timestamptz '2026-10-10 20:00:00-05:00';
$$;

create or replace function public.enforce_sr26_registration_deadline()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if exists (
    select 1 from public.events e
    where e.id = new.event_id and e.code = 'SR26'
  ) and not public.sr26_accepts_registration_at(clock_timestamp()) then
    raise exception 'INSCRIPCIONES_CERRADAS';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_sr26_registration_deadline on public.registrations;
create trigger enforce_sr26_registration_deadline
before insert on public.registrations
for each row
execute function public.enforce_sr26_registration_deadline();
