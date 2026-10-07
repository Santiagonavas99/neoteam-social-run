-- Shared by better_draws.sql (local stand-ins) and the remote rollback dry run, which
-- defines pg_temp.new_event and pg_temp.new_registration for the real tables.
do $$
declare
  v_event uuid := pg_temp.new_event();
  v_women uuid;
  v_men uuid;
  v_open uuid;
  v_stand uuid;
  v_absent uuid;
  v_new uuid;
  v_ranks integer[];
  v_failed boolean;
  r record;
begin
  assert not has_function_privilege('anon', 'public.dynamic_eligible_count(uuid, uuid)', 'execute'), 'anon cannot count';
  assert not has_function_privilege('anon', 'public.redraw_dynamic_winner(uuid, uuid, uuid)', 'execute'), 'anon cannot redraw';
  assert has_function_privilege('service_role', 'public.dynamic_points_ranking(uuid)', 'execute'), 'service_role ranks';

  -- 3 women and 3 men checked in, 1 unknown checked in, 1 woman only registered, 1 cancelled woman.
  perform pg_temp.new_registration(v_event, 'checked_in', g)
  from unnest(array['female','female','female','male','male','male', null]) g;
  perform pg_temp.new_registration(v_event, 'registered', 'female');
  perform pg_temp.new_registration(v_event, 'cancelled', 'female');

  insert into public.dynamics (name, event_id, type, status, winner_count, config)
  values ('T', v_event, 'raffle', 'open', 2, '{"gender":"female","exclude_winners":true}') returning id into v_women;
  insert into public.dynamics (name, event_id, type, status, winner_count, config)
  values ('T', v_event, 'raffle', 'open', 2, '{"gender":"male","exclude_winners":true}') returning id into v_men;
  insert into public.dynamics (name, event_id, type, status, winner_count, config)
  values ('T', v_event, 'raffle', 'open', 10, '{"exclude_winners":true}') returning id into v_open;

  assert public.dynamic_eligible_count(v_women, v_event) = 3, 'category and check-in filter the pool';
  assert public.dynamic_eligible_count(v_open, v_event) = 7, 'an open raffle takes every checked-in runner';
  assert public.dynamic_eligible_count(v_women, pg_temp.new_event()) = 0, 'count is scoped to its event';

  perform * from public.draw_dynamic(v_women, v_event);
  assert (select bool_and(g.gender = 'female') from public.dynamic_participations p
          join public.registrations g on g.id = p.registration_id
          where p.dynamic_id = v_women and p.status = 'winner'), 'women raffle draws women';
  select array_agg((metadata ->> 'rank')::integer order by (metadata ->> 'rank')::integer) into v_ranks
  from public.dynamic_participations where dynamic_id = v_women;
  assert v_ranks = array[1, 2], 'winners are ranked 1..n';

  perform * from public.draw_dynamic(v_men, v_event);
  assert public.dynamic_eligible_count(v_open, v_event) = 3, 'previous winners are left out';
  -- Replace an absent woman: the last eligible woman takes rank of the absent one.
  select registration_id into v_absent from public.dynamic_participations
  where dynamic_id = v_women and metadata ->> 'rank' = '2';
  v_new := public.redraw_dynamic_winner(v_women, v_event, v_absent);
  assert v_new <> v_absent, 'a different runner replaces the absent winner';
  assert (select status from public.dynamic_participations where dynamic_id = v_women and registration_id = v_absent)
    = 'disqualified', 'absent winner is disqualified';
  assert (select metadata ->> 'rank' from public.dynamic_participations where dynamic_id = v_women and registration_id = v_new)
    = '2', 'replacement keeps the place';

  -- No woman left: the redraw fails and the winner stays.
  begin perform public.redraw_dynamic_winner(v_women, v_event, v_new); v_failed := false;
  exception when others then v_failed := sqlerrm = 'no_eligible_participants'; end;
  assert v_failed, 'redraw with nobody left raises';
  assert (select status from public.dynamic_participations where dynamic_id = v_women and registration_id = v_new)
    = 'winner', 'failed redraw keeps the winner';

  perform * from public.draw_dynamic(v_open, v_event);
  assert not exists (
    select 1 from public.dynamic_participations p
    where p.dynamic_id = v_open and p.status = 'winner'
      and p.registration_id in (select registration_id from public.dynamic_participations
                                where dynamic_id in (v_women, v_men) and status = 'winner')
  ), 'no runner wins twice';

  -- Ranking: stand points add up, raffles do not count, ties go to the earliest.
  insert into public.dynamics (name, event_id, type, status, points) values ('T', v_event, 'qr', 'open', 10) returning id into v_stand;
  for r in select id, row_number() over (order by id) n from public.registrations where event_id = v_event and status = 'checked_in' limit 3 loop
    insert into public.dynamic_participations (dynamic_id, registration_id, points_awarded, completed_at)
    values (v_stand, r.id, case when r.n = 1 then 30 else 10 end, now() + r.n * interval '1 minute');
  end loop;
  assert (select count(*) from public.dynamic_points_ranking(v_event)) = 3, 'only runners with stand points rank';
  assert (select points from public.dynamic_points_ranking(v_event) limit 1) = 30, 'highest score first';
end $$;
