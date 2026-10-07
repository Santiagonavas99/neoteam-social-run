-- One eligibility rule for raffles, shared by the draw, its count and the replacement
-- of an absent winner. Raffle options live in dynamics.config:
--   gender          'female' | 'male' to limit the raffle to one category
--   exclude_winners true to leave out anyone who already won another dynamic of the event
-- Winners keep their place in dynamic_participations.metadata->'rank'.

create or replace function public.dynamic_eligible_registrations(
  p_dynamic_id public.dynamics.id%type
)
returns table (registration_id public.registrations.id%type)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id
  from public.dynamics d
  join public.registrations r on r.event_id = d.event_id
  where d.id = p_dynamic_id
    and r.status = any (
      case when d.requires_checkin
        then array['checked_in']
        else array['registered', 'checked_in']
      end
    )
    and (
      d.eligibility_dynamic_id is null
      or exists (
        select 1 from public.dynamic_participations q
        where q.dynamic_id = d.eligibility_dynamic_id
          and q.registration_id = r.id
          and q.status in ('completed', 'winner')
      )
    )
    and (coalesce(d.config ->> 'gender', '') = '' or r.gender = d.config ->> 'gender')
    and not exists (
      select 1 from public.dynamic_participations own
      where own.dynamic_id = d.id
        and own.registration_id = r.id
        and own.status in ('winner', 'disqualified')
    )
    and (
      d.config -> 'exclude_winners' is distinct from 'true'::jsonb
      or not exists (
        select 1
        from public.dynamic_participations w
        join public.dynamics wd on wd.id = w.dynamic_id
        where w.registration_id = r.id
          and w.status = 'winner'
          and wd.event_id = d.event_id
          and wd.id <> d.id
      )
    );
$$;

create or replace function public.dynamic_eligible_count(
  p_dynamic_id public.dynamics.id%type,
  p_event_id public.dynamics.event_id%type
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.dynamic_eligible_registrations(p_dynamic_id)
  where exists (
    select 1 from public.dynamics where id = p_dynamic_id and event_id = p_event_id
  );
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
  select id, event_id, type, status, winner_count, points, eligibility_dynamic_id
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
    dynamic_id, registration_id, status, points_awarded, source, metadata, completed_at, updated_at
  )
  select v_dynamic.id, drawn.registration_id, 'winner', v_dynamic.points, 'raffle_draw',
    jsonb_build_object('rank', row_number() over ()), now(), now()
  from (
    select e.registration_id
    from public.dynamic_eligible_registrations(v_dynamic.id) e
    order by gen_random_uuid()
    limit v_dynamic.winner_count
  ) drawn
  on conflict (dynamic_id, registration_id) do update
  set status = 'winner',
      points_awarded = excluded.points_awarded,
      source = excluded.source,
      metadata = excluded.metadata,
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

-- Marks an absent winner as disqualified and draws one replacement in their place.
-- Raises (and so keeps the absent winner) when nobody is left to draw.
create or replace function public.redraw_dynamic_winner(
  p_dynamic_id public.dynamics.id%type,
  p_event_id public.dynamics.event_id%type,
  p_registration_id public.registrations.id%type
)
returns public.registrations.id%type
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dynamic record;
  v_rank jsonb;
  v_replacement public.registrations.id%type;
begin
  select id, type, status, points
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

  update public.dynamic_participations
  set status = 'disqualified', points_awarded = 0, updated_at = now()
  where dynamic_id = v_dynamic.id and registration_id = p_registration_id and status = 'winner'
  returning metadata -> 'rank' into v_rank;

  if not found then
    raise exception 'winner_not_found';
  end if;

  select e.registration_id into v_replacement
  from public.dynamic_eligible_registrations(v_dynamic.id) e
  order by gen_random_uuid()
  limit 1;

  if v_replacement is null then
    raise exception 'no_eligible_participants';
  end if;

  insert into public.dynamic_participations (
    dynamic_id, registration_id, status, points_awarded, source, metadata, completed_at, updated_at
  )
  values (
    v_dynamic.id, v_replacement, 'winner', v_dynamic.points, 'raffle_redraw',
    jsonb_build_object('rank', v_rank), now(), now()
  )
  on conflict (dynamic_id, registration_id) do update
  set status = 'winner',
      points_awarded = excluded.points_awarded,
      source = excluded.source,
      metadata = excluded.metadata,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at;

  return v_replacement;
end;
$$;

-- Top 10 runners by points from stands, checkpoints and challenges (raffles excluded);
-- ties go to whoever reached the score first.
create or replace function public.dynamic_points_ranking(
  p_event_id public.dynamics.event_id%type
)
returns table (registration_id public.registrations.id%type, points integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.registration_id, sum(p.points_awarded)::integer as points
  from public.dynamic_participations p
  join public.dynamics d on d.id = p.dynamic_id
  join public.registrations r on r.id = p.registration_id
  where d.event_id = p_event_id
    and d.type <> 'raffle'
    and p.status in ('completed', 'winner')
    and r.status <> 'cancelled'
  group by p.registration_id
  having sum(p.points_awarded) > 0
  order by points desc, max(p.completed_at) asc
  limit 10;
$$;

revoke execute on function public.dynamic_eligible_registrations from public, anon, authenticated;
revoke execute on function public.dynamic_eligible_count from public, anon, authenticated;
revoke execute on function public.draw_dynamic from public, anon, authenticated;
revoke execute on function public.redraw_dynamic_winner from public, anon, authenticated;
revoke execute on function public.dynamic_points_ranking from public, anon, authenticated;
grant execute on function public.dynamic_eligible_registrations to service_role;
grant execute on function public.dynamic_eligible_count to service_role;
grant execute on function public.draw_dynamic to service_role;
grant execute on function public.redraw_dynamic_winner to service_role;
grant execute on function public.dynamic_points_ranking to service_role;
