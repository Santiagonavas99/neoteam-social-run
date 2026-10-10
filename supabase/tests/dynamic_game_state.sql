-- Standalone database contract for the Dynamics V2 stage, run in temporary schema.
create table public.events(id uuid primary key, code text);
create table public.registrations(
 id uuid primary key, first_name text, last_name text, document_number text, email text
);
create table public.dynamics(
 id uuid primary key, event_id uuid references public.events(id),
 name text, type text, status text, prize text, winner_count integer, updated_at timestamptz default now()
);
create table public.dynamic_participations(
 dynamic_id uuid references public.dynamics(id),
 registration_id uuid references public.registrations(id),
 status text, metadata jsonb default '{}'::jsonb
);
\ir ../migrations/20261009180000_dynamic_game_state.sql
do $$
declare
  v_event uuid := '11111111-1111-4111-8111-111111111111';
  v_dynamic uuid := '22222222-2222-4222-8222-222222222222';
  v_runner uuid := '33333333-3333-4333-8333-333333333333';
  v_data jsonb;
  v_failed boolean;
begin
  assert has_function_privilege('anon','public.public_dynamic_game(uuid)','EXECUTE'),
    'anonymous spectators can see sanitized game state';
  assert not has_function_privilege('anon','public.dynamic_game_command(uuid,uuid,text)','EXECUTE'),
    'anonymous users cannot control a game';
  assert not has_table_privilege('anon','public.dynamic_game_state','SELECT'),
    'no direct public access to state table';

  insert into public.events values(v_event,'SR26');
  insert into public.dynamics(id,event_id,name,type,status,prize,winner_count)
  values(v_dynamic,v_event,'Sorteo de bienvenida','raffle','open','Premio',1);
  insert into public.registrations values(v_runner,'Ana','Ríos','SECRET_DOC','SECRET_EMAIL');
  v_data := public.public_dynamic_game(v_dynamic);
  assert v_data->>'phase' = 'ready', 'stage starts ready';
  assert v_data->'winners' = '[]'::jsonb, 'no names before draw';
  perform public.dynamic_game_command(v_dynamic,v_event,'countdown');
  assert (public.public_dynamic_game(v_dynamic)->>'phase') = 'countdown', 'countdown published';

  update public.dynamics set status='completed' where id=v_dynamic;
  insert into public.dynamic_participations values(v_dynamic,v_runner,'winner','{"rank":1}');
  v_data := public.public_dynamic_game(v_dynamic);
  assert v_data->'winners' = '[]'::jsonb, 'draw does not auto-reveal private names';
  perform public.dynamic_game_command(v_dynamic,v_event,'drawn');
  assert (public.public_dynamic_game(v_dynamic)->'winners') = '[]'::jsonb, 'ready to reveal';
  perform public.dynamic_game_command(v_dynamic,v_event,'next');
  v_data := public.public_dynamic_game(v_dynamic);
  assert v_data->'winners' = '[]'::jsonb, 'winner name stays private during suspense';
  begin
    perform public.dynamic_game_command(v_dynamic,v_event,'finish');
    v_failed := false;
  exception when others then v_failed := sqlerrm = 'game_reveal_wait'; end;
  assert v_failed, 'cannot finish while the final winner is still hidden';
  update public.dynamic_game_state
    set updated_at = now() - interval '4 seconds' where dynamic_id = v_dynamic;
  v_data := public.public_dynamic_game(v_dynamic);
  assert v_data->'winners'->0->>'name' = 'Ana Ríos', 'first winner revealed after suspense';
  assert not v_data::text like '%SECRET_DOC%', 'documents never projected';
  assert not v_data::text like '%SECRET_EMAIL%', 'emails never projected';
  perform public.dynamic_game_command(v_dynamic,v_event,'finish');
  assert (public.public_dynamic_game(v_dynamic)->>'phase') = 'finished', 'finished state';
  begin
    perform public.dynamic_game_command(v_dynamic,v_event,'next');
    v_failed := false;
  exception when others then v_failed := sqlerrm = 'game_not_revealing'; end;
  assert v_failed, 'cannot advance a finished game';
end $$;
