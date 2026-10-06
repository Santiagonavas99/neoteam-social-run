-- Minimal stand-ins for remote-only tables, with the columns the app uses.
create table public.events (id uuid primary key default gen_random_uuid(), code text);
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  status text not null default 'registered'
);
create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  winner_count integer not null default 1,
  requires_checkin boolean not null default true,
  status text not null default 'draft',
  draw_at timestamptz
);
create table public.raffle_entries (
  raffle_id uuid not null references public.raffles(id),
  registration_id uuid not null references public.registrations(id),
  is_winner boolean not null default false,
  drawn_at timestamptz,
  unique (raffle_id, registration_id)
);
create table public.dynamics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  type text not null,
  status text not null default 'draft',
  points integer not null default 0,
  requires_checkin boolean not null default true,
  winner_count integer not null default 1,
  eligibility_dynamic_id uuid references public.dynamics(id),
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
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (dynamic_id, registration_id)
);

\ir ../migrations/20261006091000_atomic_draws.sql

do $$
declare
  v_event uuid;
  v_other_event uuid;
  v_raffle uuid;
  v_dynamic uuid;
  v_gate uuid;
  v_instant uuid;
  v_reg uuid;
  v_status text;
  v_count integer;
  v_failed boolean;
begin
  assert not has_function_privilege('anon', 'public.draw_raffle(uuid, uuid)', 'execute'), 'anon cannot draw';
  assert has_function_privilege('service_role', 'public.draw_dynamic(uuid, uuid)', 'execute'), 'service_role draws';

  insert into public.events (code) values ('SR26') returning id into v_event;
  insert into public.events (code) values ('OTHER') returning id into v_other_event;
  insert into public.registrations (event_id, status)
  select v_event, s from unnest(array['checked_in','checked_in','checked_in','registered','cancelled']) s;

  -- Raffle: wrong event, not open, success, second draw refused, no eligible keeps winners.
  insert into public.raffles (event_id, winner_count, status) values (v_event, 2, 'draft') returning id into v_raffle;
  begin perform public.draw_raffle(v_raffle, v_other_event); v_failed := false;
  exception when others then v_failed := sqlerrm = 'raffle_not_found'; end;
  assert v_failed, 'raffle is scoped to its event';
  begin perform public.draw_raffle(v_raffle, v_event); v_failed := false;
  exception when others then v_failed := sqlerrm = 'raffle_not_open'; end;
  assert v_failed, 'draft raffle cannot be drawn';

  update public.raffles set status = 'open' where id = v_raffle;
  assert public.draw_raffle(v_raffle, v_event) = 2, 'two winners drawn';
  assert (select status from public.raffles where id = v_raffle) = 'drawn', 'raffle marked drawn';
  assert (select count(*) from public.raffle_entries e join public.registrations r on r.id = e.registration_id
          where e.raffle_id = v_raffle and r.status = 'checked_in') = 2, 'winners are checked in';
  begin perform public.draw_raffle(v_raffle, v_event); v_failed := false;
  exception when others then v_failed := sqlerrm = 'raffle_not_open'; end;
  assert v_failed, 'a drawn raffle cannot be drawn again';

  update public.raffles set status = 'open', requires_checkin = true where id = v_raffle;
  update public.registrations set status = 'registered' where status = 'checked_in';
  begin perform public.draw_raffle(v_raffle, v_event); v_failed := false;
  exception when others then v_failed := sqlerrm = 'no_eligible_participants'; end;
  assert v_failed, 'no eligible participants raises';
  assert (select count(*) from public.raffle_entries where raffle_id = v_raffle) = 2,
    'a failed draw rolls back and keeps the previous winners';
  update public.registrations set status = 'checked_in' where status = 'registered'
    and id in (select id from public.registrations where status = 'registered' limit 3);

  -- Dynamic raffle gated by another dynamic.
  insert into public.dynamics (event_id, type, status) values (v_event, 'qr', 'open') returning id into v_gate;
  insert into public.dynamics (event_id, type, status, winner_count, points, eligibility_dynamic_id)
  values (v_event, 'raffle', 'open', 5, 10, v_gate) returning id into v_dynamic;
  begin perform * from public.draw_dynamic(v_dynamic, v_event); v_failed := false;
  exception when others then v_failed := sqlerrm = 'no_qualifying_participants'; end;
  assert v_failed, 'gated draw needs qualifying participants';

  select id into v_reg from public.registrations where status = 'checked_in' limit 1;
  insert into public.dynamic_participations (dynamic_id, registration_id) values (v_gate, v_reg);
  select count(*) into v_count from public.draw_dynamic(v_dynamic, v_event);
  assert v_count = 1, 'only the qualifying participant can win';
  assert (select registration_id from public.dynamic_participations
          where dynamic_id = v_dynamic and status = 'winner') = v_reg, 'qualifying participant won';
  assert (select status from public.dynamics where id = v_dynamic) = 'completed', 'dynamic completed';
  begin perform * from public.draw_dynamic(v_gate, v_event); v_failed := false;
  exception when others then v_failed := sqlerrm = 'dynamic_not_raffle'; end;
  assert v_failed, 'only raffle dynamics can be drawn';

  -- Instant win never exceeds winner_count, and a repeat scan returns null.
  insert into public.dynamics (event_id, type, status, winner_count, points)
  values (v_event, 'instant_win', 'open', 2, 5) returning id into v_instant;
  for v_reg in select id from public.registrations loop
    perform public.record_dynamic_participation(v_instant, v_reg, true);
  end loop;
  assert (select count(*) from public.dynamic_participations where dynamic_id = v_instant and status = 'winner') = 2,
    'instant win caps winners at winner_count';
  assert (select count(*) from public.dynamic_participations where dynamic_id = v_instant) = 5, 'everyone recorded';
  select id into v_reg from public.registrations limit 1;
  v_status := public.record_dynamic_participation(v_instant, v_reg, true);
  assert v_status is null, 'repeat scan returns null';
  assert public.record_dynamic_participation(v_gate, (select id from public.registrations offset 1 limit 1), true)
    = 'completed', 'non instant-win dynamics never award winners';
end $$;
