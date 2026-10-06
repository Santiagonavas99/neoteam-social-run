create table if not exists public.dynamics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'qr' check (type = any (array['raffle','qr','checkpoint','challenge','trivia','mission','voting','instant_win','points']::text[])),
  status text not null default 'draft' check (status = any (array['draft','open','closed','completed','cancelled']::text[])),
  sponsor_brand_id uuid references public.brands(id) on delete set null,
  points integer not null default 0 check (points >= 0),
  requires_checkin boolean not null default true,
  prize text,
  winner_count integer not null default 1 check (winner_count > 0),
  eligibility_dynamic_id uuid references public.dynamics(id) on delete set null,
  legacy_raffle_id uuid references public.raffles(id) on delete set null,
  draw_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dynamics enable row level security;

create index if not exists dynamics_event_idx on public.dynamics(event_id, status, type);
create index if not exists dynamics_sponsor_idx on public.dynamics(sponsor_brand_id);
create unique index if not exists dynamics_legacy_raffle_unique
  on public.dynamics(legacy_raffle_id)
  where legacy_raffle_id is not null;

create table if not exists public.dynamic_participations (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.dynamics(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  status text not null default 'completed' check (status = any (array['entered','completed','winner','disqualified']::text[])),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  source text not null default 'admin',
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dynamic_id, registration_id)
);

alter table public.dynamic_participations enable row level security;

create index if not exists dynamic_participations_registration_idx
  on public.dynamic_participations(registration_id, created_at desc);
create index if not exists dynamic_participations_dynamic_status_idx
  on public.dynamic_participations(dynamic_id, status);

insert into public.dynamics (
  event_id, name, description, type, status, sponsor_brand_id, points,
  requires_checkin, prize, winner_count, legacy_raffle_id, draw_at,
  created_at, updated_at
)
select
  r.event_id,
  r.name,
  r.description,
  'raffle',
  case r.status
    when 'drawn' then 'completed'
    when 'open' then 'open'
    when 'cancelled' then 'cancelled'
    else 'draft'
  end,
  r.sponsor_brand_id,
  0,
  r.requires_checkin,
  r.prize,
  r.winner_count,
  r.id,
  r.draw_at,
  r.created_at,
  r.updated_at
from public.raffles r
where not exists (
  select 1 from public.dynamics d where d.legacy_raffle_id = r.id
);

insert into public.dynamic_participations (
  dynamic_id, registration_id, status, points_awarded, source, completed_at, created_at, updated_at
)
select
  d.id,
  re.registration_id,
  case when re.is_winner then 'winner' else 'entered' end,
  0,
  'raffle_migration',
  re.drawn_at,
  re.created_at,
  now()
from public.raffle_entries re
join public.dynamics d on d.legacy_raffle_id = re.raffle_id
on conflict (dynamic_id, registration_id) do update
set status = excluded.status,
    completed_at = excluded.completed_at,
    updated_at = now();
