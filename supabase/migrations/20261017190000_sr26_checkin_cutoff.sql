-- SR26: cutoff is Sunday 18 Oct 2026 at 08:00 America/Bogota = 13:00 UTC.
-- Apply this migration BEFORE deploying the matching admin-pin Edge Function.
alter table public.events add column if not exists checkin_deadline timestamptz;

update public.events
set checkin_deadline = timestamptz '2026-10-18 08:00:00-05:00'
where code = 'SR26' and checkin_deadline is null;

-- Separating the predicate makes boundary tests deterministic without moving the DB clock.
create or replace function public.sr26_accepts_checkin_at(p_event_id uuid, p_at timestamptz)
returns boolean language sql stable security invoker
set search_path to ''
as $$
  select coalesce(
    (select e.checkin_deadline is not null and p_at < e.checkin_deadline
      from public.events e where e.id = p_event_id and e.code = 'SR26'),
    false
  );
$$;
revoke all on function public.sr26_accepts_checkin_at(uuid, timestamptz) from public;
grant execute on function public.sr26_accepts_checkin_at(uuid, timestamptz) to service_role;

-- All regular check-in writes (scanner and Participants) cross this trigger.
-- Already checked-in participants keep their status and can enter raffles/dynamics.
create or replace function public.enforce_sr26_checkin_deadline()
returns trigger language plpgsql security invoker
set search_path to ''
as $$
begin
  if old.status is distinct from 'checked_in' and new.status = 'checked_in'
    and exists (select 1 from public.events e where e.id = new.event_id and e.code = 'SR26')
    and not public.sr26_accepts_checkin_at(new.event_id, clock_timestamp())
    and current_setting('app.sr26_checkin_exception', true) is distinct from 'authorized' then
    raise exception 'CHECKIN_CERRADO';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_sr26_checkin_deadline on public.registrations;
create trigger enforce_sr26_checkin_deadline
before update of status on public.registrations
for each row execute function public.enforce_sr26_checkin_deadline();

-- Records the actor and the mandatory reason. Never readable by public browser roles.
create table if not exists public.checkin_exceptions (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id),
  registration_id uuid references public.registrations(id) on delete set null,
  admin_user_id uuid references public.admin_users(id) on delete set null,
  reason text not null check (char_length(reason) between 10 and 400),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists checkin_exceptions_registration_idx
  on public.checkin_exceptions(registration_id, created_at desc);
alter table public.checkin_exceptions enable row level security;
revoke all on public.checkin_exceptions from public, anon, authenticated;

-- Only admin-pin (service_role + verified admin session) can invoke this audited escape hatch.
create or replace function public.sr26_admin_checkin_exception(
  p_registration_id uuid, p_admin_user_id uuid, p_reason text
)
returns text language plpgsql security definer
set search_path to ''
as $$
declare
  v_row public.registrations%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if char_length(v_reason) not between 10 and 400 then
    raise exception 'MOTIVO_INVALIDO';
  end if;
  if not exists (
    select 1 from public.admin_users a
    where a.id = p_admin_user_id and a.role = 'admin' and a.active is true
  ) then
    raise exception 'ADMIN_NO_AUTORIZADO';
  end if;

  select r.* into v_row from public.registrations r
  join public.events e on e.id = r.event_id and e.code = 'SR26'
  where r.id = p_registration_id for update of r;

  if not found then return 'not_found'; end if;
  if v_row.status = 'checked_in' then return 'already_checked_in'; end if;
  if v_row.status not in ('registered', 'no_show') then return 'not_allowed'; end if;
  if public.sr26_accepts_checkin_at(v_row.event_id, clock_timestamp()) then
    raise exception 'CHECKIN_AUN_ABIERTO';
  end if;

  -- Transaction-local override, used only within this RPC's audited update.
  perform set_config('app.sr26_checkin_exception', 'authorized', true);
  update public.registrations
  set status = 'checked_in', checked_in_at = clock_timestamp()
  where id = v_row.id;
  perform set_config('app.sr26_checkin_exception', '', true);

  insert into public.checkin_exceptions(event_id, registration_id, admin_user_id, reason)
  values (v_row.event_id, v_row.id, p_admin_user_id, v_reason);
  return 'checked_in';
exception when others then
  perform set_config('app.sr26_checkin_exception', '', true);
  raise;
end;
$$;
revoke all on function public.sr26_admin_checkin_exception(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.sr26_admin_checkin_exception(uuid, uuid, text) to service_role;
