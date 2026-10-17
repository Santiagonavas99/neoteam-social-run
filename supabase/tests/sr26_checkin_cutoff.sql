-- Isolated disposable DB test: no real participant data.
create table public.events(
  id uuid primary key default gen_random_uuid(), code text not null unique
);
create table public.admin_users(
  id uuid primary key default gen_random_uuid(),
  role text not null, active boolean not null default true
);
create table public.registrations(
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  status text not null default 'registered',
  checked_in_at timestamptz
);
insert into public.events(code) values ('SR26'), ('OTHER');
insert into public.admin_users(role) values ('admin'), ('checkin');
insert into public.registrations(event_id)
select id from public.events where code = 'SR26';
insert into public.registrations(event_id)
select id from public.events where code = 'OTHER';

\ir ../migrations/20261017190000_sr26_checkin_cutoff.sql

do $$
declare v_id uuid;
begin
  select id into v_id from public.events where code = 'SR26';
  assert public.sr26_accepts_checkin_at(v_id, timestamptz '2026-10-18 12:59:59.999+00'), 'open before 8am';
  assert not public.sr26_accepts_checkin_at(v_id, timestamptz '2026-10-18 13:00:00+00'), 'closed at 8am';
  assert not public.sr26_accepts_checkin_at(v_id, timestamptz '2026-10-18 13:00:00.001+00'), 'closed after 8am';
end $$;

-- Simulate the cutoff in the past to exercise the real UPDATE trigger.
update public.events set checkin_deadline = timestamptz '2000-01-01 00:00:00+00' where code = 'SR26';
do $$
declare v_id uuid;
begin
  select r.id into v_id from public.registrations r
  join public.events e on e.id = r.event_id where e.code = 'SR26';
  begin
    update public.registrations set status='checked_in' where id = v_id;
    raise exception 'normal check-in improperly allowed';
  exception when raise_exception then
    if SQLERRM <> 'CHECKIN_CERRADO' then raise; end if;
  end;
  assert (select status = 'registered' from public.registrations where id = v_id), 'blocked status unchanged';
  assert public.sr26_admin_checkin_exception(
    v_id, (select id from public.admin_users where role='admin' limit 1), 'Llegada verificada presencialmente'
  ) = 'checked_in', 'admin exception succeeds';
  assert (select status = 'checked_in' from public.registrations where id = v_id), 'exception checked-in';
  assert (select count(*) = 1 from public.checkin_exceptions where registration_id = v_id), 'exception audited';
  update public.registrations set checked_in_at = now() where id = v_id;
  assert public.sr26_admin_checkin_exception(
    v_id, (select id from public.admin_users where role='admin' limit 1), 'Intento repetido de asistente'
  ) = 'already_checked_in', 'no duplicate exception';
end $$;

-- OTHER events are unaffected.
update public.registrations r set status = 'checked_in'
from public.events e where r.event_id = e.id and e.code = 'OTHER';
