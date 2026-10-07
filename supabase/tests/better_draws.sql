-- Minimal stand-ins for remote-only tables, with the columns the app uses.
create table public.events (id uuid primary key default gen_random_uuid(), code text);
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  status text not null default 'registered',
  gender text
);
create table public.dynamics (
  id uuid primary key default gen_random_uuid(),
  name text,
  event_id uuid not null references public.events(id),
  type text not null,
  status text not null default 'draft',
  points integer not null default 0,
  requires_checkin boolean not null default true,
  winner_count integer not null default 1,
  eligibility_dynamic_id uuid references public.dynamics(id),
  config jsonb not null default '{}',
  draw_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.dynamic_participations (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.dynamics(id),
  registration_id uuid not null references public.registrations(id),
  status text not null default 'completed',
  points_awarded integer not null default 0,
  source text not null default 'admin',
  metadata jsonb not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (dynamic_id, registration_id)
);
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;

create function pg_temp.new_event() returns uuid language sql as
  $$ insert into public.events (code) values ('TEST') returning id $$;
create function pg_temp.new_registration(p_event uuid, p_status text, p_gender text) returns uuid language sql as
  $$ insert into public.registrations (event_id, status, gender) values (p_event, p_status, p_gender) returning id $$;

\ir ../migrations/20261007040000_better_draws.sql
\ir cases/better_draws.sql
