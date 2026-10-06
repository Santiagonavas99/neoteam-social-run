-- Draws and instant wins run as single transactions that lock the raffle or
-- dynamic row first, so a double click or two staff members acting at once
-- serialize instead of overwriting each other, and a failure rolls back
-- without losing the previous winners. Winners are ordered by gen_random_uuid(),
-- which Postgres draws from a cryptographically strong source.
-- Errors are raised with stable identifiers in MESSAGE for the Edge Function.

create or replace function public.draw_raffle(
  p_raffle_id public.raffles.id%type,
  p_event_id public.raffles.event_id%type
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raffle record;
  v_winners integer;
begin
  select id, event_id, winner_count, requires_checkin, status
  into v_raffle
  from public.raffles
  where id = p_raffle_id and event_id = p_event_id
  for update;

  if not found then
    raise exception 'raffle_not_found';
  end if;
  if v_raffle.status <> 'open' then
    raise exception 'raffle_not_open';
  end if;

  delete from public.raffle_entries where raffle_id = v_raffle.id;

  insert into public.raffle_entries (raffle_id, registration_id, is_winner, drawn_at)
  select v_raffle.id, r.id, true, now()
  from public.registrations r
  where r.event_id = v_raffle.event_id
    and r.status <> 'cancelled'
    and (not v_raffle.requires_checkin or r.status = 'checked_in')
  order by gen_random_uuid()
  limit v_raffle.winner_count;

  get diagnostics v_winners = row_count;
  if v_winners = 0 then
    raise exception 'no_eligible_participants';
  end if;

  update public.raffles set status = 'drawn', draw_at = now() where id = v_raffle.id;
  return v_winners;
end;
$$;

create or replace function public.draw_dynamic(
  p_dynamic_id public.dynamics.id%type,
  p_event_id public.dynamics.event_id%type
)
returns table (registration_id public.registrations.id%type)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_dynamic record;
  v_winners integer;
begin
  select id, event_id, type, status, winner_count, requires_checkin, points, eligibility_dynamic_id
  into v_dynamic
  from public.dynamics
  where id = p_dynamic_id and event_id = p_event_id
  for update;

  if not found then
    raise exception 'dynamic_not_found';
  end if;
  if v_dynamic.type <> 'raffle' then
    raise exception 'dynamic_not_raffle';
  end if;
  if v_dynamic.status <> 'open' then
    raise exception 'dynamic_not_open';
  end if;
  if v_dynamic.eligibility_dynamic_id is not null and not exists (
    select 1 from public.dynamic_participations
    where dynamic_id = v_dynamic.eligibility_dynamic_id and status in ('completed', 'winner')
  ) then
    raise exception 'no_qualifying_participants';
  end if;

  delete from public.dynamic_participations
  where dynamic_id = v_dynamic.id and status = 'winner';

  return query
  insert into public.dynamic_participations as dp (
    dynamic_id, registration_id, status, points_awarded, source, completed_at, updated_at
  )
  select v_dynamic.id, r.id, 'winner', v_dynamic.points, 'raffle_draw', now(), now()
  from public.registrations r
  where r.event_id = v_dynamic.event_id
    and r.status = any (
      case when v_dynamic.requires_checkin
        then array['checked_in']
        else array['registered', 'checked_in']
      end
    )
    and (
      v_dynamic.eligibility_dynamic_id is null
      or r.id in (
        select q.registration_id from public.dynamic_participations q
        where q.dynamic_id = v_dynamic.eligibility_dynamic_id and q.status in ('completed', 'winner')
      )
    )
  order by gen_random_uuid()
  limit v_dynamic.winner_count
  on conflict (dynamic_id, registration_id) do update
  set status = 'winner',
      points_awarded = excluded.points_awarded,
      source = excluded.source,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at
  returning dp.registration_id;

  get diagnostics v_winners = row_count;
  if v_winners = 0 then
    raise exception 'no_eligible_participants';
  end if;

  update public.dynamics
  set status = 'completed', draw_at = now(), updated_at = now()
  where id = v_dynamic.id;
end;
$$;

-- p_won_roll is the caller's random roll against the dynamic's win probability;
-- this function only enforces winner_count under the row lock. Returns the new
-- participation status, or null when the participant already had one.
create or replace function public.record_dynamic_participation(
  p_dynamic_id public.dynamics.id%type,
  p_registration_id public.registrations.id%type,
  p_won_roll boolean,
  p_source text default 'staff_scan'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dynamic record;
  v_status text := 'completed';
  v_inserted integer;
begin
  select id, type, points, winner_count
  into v_dynamic
  from public.dynamics
  where id = p_dynamic_id
  for update;

  if not found then
    raise exception 'dynamic_not_found';
  end if;

  if v_dynamic.type = 'instant_win' and p_won_roll and (
    select count(*) from public.dynamic_participations
    where dynamic_id = v_dynamic.id and status = 'winner'
  ) < v_dynamic.winner_count then
    v_status := 'winner';
  end if;

  insert into public.dynamic_participations (
    dynamic_id, registration_id, status, points_awarded, source, completed_at, updated_at
  )
  values (v_dynamic.id, p_registration_id, v_status, v_dynamic.points, p_source, now(), now())
  on conflict (dynamic_id, registration_id) do nothing;

  get diagnostics v_inserted = row_count;
  return case when v_inserted = 1 then v_status end;
end;
$$;

revoke execute on function public.draw_raffle from public, anon, authenticated;
revoke execute on function public.draw_dynamic from public, anon, authenticated;
revoke execute on function public.record_dynamic_participation from public, anon, authenticated;
grant execute on function public.draw_raffle to service_role;
grant execute on function public.draw_dynamic to service_role;
grant execute on function public.record_dynamic_participation to service_role;
