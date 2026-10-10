-- Dynamics V2: projection-only stage state. Real draws still use the existing atomic RPC.
-- No participant's document, contact details or private token is included in the public projection.
create table if not exists public.dynamic_game_state (
  dynamic_id uuid primary key references public.dynamics(id) on delete cascade,
  phase text not null default 'ready'
    check (phase in ('ready', 'countdown', 'reveal', 'finished')),
  shown_count integer not null default 0 check (shown_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.dynamic_game_state enable row level security;
revoke all on public.dynamic_game_state from anon, authenticated;
grant all on public.dynamic_game_state to service_role;

-- Serializable transitions for multiple event-day operators, checking real draw status.
create or replace function public.dynamic_game_command(
  p_dynamic_id uuid, p_event_id uuid, p_command text
) returns table(phase text, shown_count integer, updated_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  d record;
  g record;
  v_total integer;
begin
  select id, type, status into d from public.dynamics
  where id = p_dynamic_id and event_id = p_event_id for update;
  if not found then raise exception 'game_not_found'; end if;
  if d.type <> 'raffle' then raise exception 'game_not_raffle'; end if;

  if p_command = 'ready' then
    if d.status not in ('open','completed') then raise exception 'game_not_active'; end if;
    insert into public.dynamic_game_state(dynamic_id, phase, shown_count)
    values (d.id, 'ready', 0)
    on conflict (dynamic_id) do update
      set phase = 'ready', shown_count = 0, updated_at = now();

  elsif p_command = 'countdown' then
    if d.status <> 'open' then raise exception 'game_not_open'; end if;
    insert into public.dynamic_game_state(dynamic_id, phase, shown_count)
    values (d.id, 'countdown', 0)
    on conflict (dynamic_id) do update
      set phase = 'countdown', shown_count = 0, updated_at = now();

  elsif p_command = 'drawn' then
    if d.status <> 'completed' then raise exception 'game_not_drawn'; end if;
    select count(*)::integer into v_total from public.dynamic_participations
    where dynamic_id = d.id and status = 'winner';
    if v_total = 0 then raise exception 'game_no_winners'; end if;
    insert into public.dynamic_game_state(dynamic_id, phase, shown_count)
    values (d.id, 'reveal', 0)
    on conflict (dynamic_id) do update
      set phase = 'reveal', shown_count = 0, updated_at = now();

  elsif p_command = 'next' then
    if d.status <> 'completed' then raise exception 'game_not_drawn'; end if;
    select count(*)::integer into v_total from public.dynamic_participations
    where dynamic_id = d.id and status = 'winner';
    select * into g from public.dynamic_game_state
    where dynamic_id = d.id for update;
    if not found or g.phase <> 'reveal' then raise exception 'game_not_revealing'; end if;
    -- Do not allow a second operator/API call to skip the current reveal animation.
    if g.shown_count > 0 and g.updated_at > clock_timestamp() - interval '3200 milliseconds' then
      raise exception 'game_reveal_wait';
    end if;
    update public.dynamic_game_state
    set shown_count = least(g.shown_count + 1, v_total), updated_at = now()
    where dynamic_id = d.id;

  elsif p_command = 'finish' then
    if d.status <> 'completed' then raise exception 'game_not_drawn'; end if;
    select count(*)::integer into v_total from public.dynamic_participations
    where dynamic_id = d.id and status = 'winner';
    select * into g from public.dynamic_game_state
    where dynamic_id = d.id for update;
    if not found or g.phase <> 'reveal' or g.shown_count < v_total then
      raise exception 'game_reveal_remaining';
    end if;
    if g.shown_count > 0 and g.updated_at > clock_timestamp() - interval '3200 milliseconds' then
      raise exception 'game_reveal_wait';
    end if;
    update public.dynamic_game_state set phase = 'finished', updated_at = now()
    where dynamic_id = d.id;

  else
    raise exception 'game_invalid_command';
  end if;
  return query select s.phase, s.shown_count, s.updated_at
    from public.dynamic_game_state s where s.dynamic_id = d.id;
end
$$;

revoke all on function public.dynamic_game_command(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.dynamic_game_command(uuid,uuid,text) to service_role;

-- Read-only sanitized game payload. Names become public *only when the operator reveals them*.
create or replace function public.public_dynamic_game(p_dynamic_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
select jsonb_build_object(
  'id', d.id, 'name', d.name, 'type', d.type,
  'prize', coalesce(d.prize, ''), 'status', d.status,
  'winnerCount', d.winner_count,
  'phase', coalesce(g.phase, 'ready'),
  'shownCount', coalesce(g.shown_count, 0),
  'updatedAt', coalesce(g.updated_at, d.updated_at),
  'participations', (
    select count(*) from public.dynamic_participations dp where dp.dynamic_id = d.id
  ),
  'winners', coalesce((
    select jsonb_agg(jsonb_build_object(
      'rank', (dp.metadata->>'rank')::integer,
      'name', trim(concat_ws(' ', r.first_name, r.last_name)))
      order by (dp.metadata->>'rank')::int)
    from public.dynamic_participations dp
    join public.registrations r on r.id = dp.registration_id
    where dp.dynamic_id = d.id
      and dp.status = 'winner'
      and d.status = 'completed'
      and g.phase in ('reveal','finished')
      and (dp.metadata->>'rank') ~ '^[0-9]+$'
      and (dp.metadata->>'rank')::int <= case
        -- The public endpoint must not expose the current name in network responses
        -- while the projected stage is still building suspense.
        when g.phase = 'reveal' and g.updated_at > clock_timestamp() - interval '3200 milliseconds'
          then greatest(g.shown_count - 1, 0)
        else g.shown_count
      end
  ), '[]'::jsonb)
)
from public.dynamics d
join public.events e on e.id = d.event_id
left join public.dynamic_game_state g on g.dynamic_id = d.id
where d.id = p_dynamic_id and e.code = 'SR26'
  and d.status in ('open','completed')
limit 1;
$$;
revoke all on function public.public_dynamic_game(uuid) from public;
grant execute on function public.public_dynamic_game(uuid) to anon, authenticated, service_role;
