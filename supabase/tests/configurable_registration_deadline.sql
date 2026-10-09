-- Minimal stand-in for the production events/registrations schema.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  registration_open boolean not null default true,
  status text not null default 'published'
);
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null
);
insert into public.events (code) values ('SR26');
\ir ../migrations/20261009150000_configurable_registration_deadline.sql

do $$
begin
  assert public.sr26_accepts_registration_at(timestamptz '2026-10-18T00:59:59.999Z'), 'open before deadline';
  assert not public.sr26_accepts_registration_at(timestamptz '2026-10-18T01:00:00Z'), 'closed at deadline';
  assert exists (select 1 from public.get_sr26_registration_settings() where deadline = timestamptz '2026-10-17 20:00:00-05:00'), 'public status';
end $$;

update public.events set registration_deadline = timestamptz '2026-10-21 19:30-05:00' where code = 'SR26';
do $$
begin
  assert public.sr26_accepts_registration_at(timestamptz '2026-10-20T01:00:00Z'), 'admin can extend registration';
end $$;

update public.events set registration_open = false where code = 'SR26';
do $$
begin
  assert not public.sr26_accepts_registration_at(timestamptz '2026-10-10T00:00:00Z'), 'admin can close immediately';
end $$;
