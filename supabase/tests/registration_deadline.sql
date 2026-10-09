-- Minimal stand-in schema; production tables live outside this repo's migrations.
create table public.events (
  id uuid primary key,
  code text not null
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null
);

\ir ../migrations/20261009130000_registration_deadline.sql

do $$
declare
  v_event_id uuid := '11111111-1111-4111-8111-111111111111';
begin
  assert public.sr26_accepts_registration_at(timestamptz '2026-10-11 00:59:59.999+00'),
    'Registration must be open one millisecond before the cutoff';

  assert not public.sr26_accepts_registration_at(timestamptz '2026-10-11 01:00:00+00'),
    'Registration must close exactly at 8 p.m. Colombia time';

  assert not public.sr26_accepts_registration_at(timestamptz '2026-10-11 01:00:01+00'),
    'Registration must remain closed after the cutoff';

  insert into public.events (id, code) values (v_event_id, 'SR26');
  -- The database test can run after the real cutoff: verify trigger exists independently.
  assert exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_sr26_registration_deadline' and not tgisinternal
  ), 'Deadline trigger missing';

  assert exists (
    select 1 from pg_proc
    where proname = 'enforce_sr26_registration_deadline'
  ), 'Deadline function missing';

  -- Updates are deliberately unaffected by the trigger; only INSERT is guarded.
  insert into public.registrations (event_id)
  values ('22222222-2222-4222-8222-222222222222');
  update public.registrations set event_id = v_event_id;
end $$;
