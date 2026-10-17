-- Standalone regression fixture for scripts/test-db.sh (isolated throwaway PostgreSQL).
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table public.events (
 id uuid primary key default gen_random_uuid(), code text not null
);
create table public.registrations (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id),
 status text not null default 'checked_in'
);
create table public.dynamics (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id),
 name text not null, type text not null, status text not null default 'draft',
 requires_checkin boolean not null default true,
 winner_count integer not null default 1,
 prize text,
 config jsonb not null default '{}'
);
create table public.dynamic_participations (
 id uuid primary key default gen_random_uuid(),
 dynamic_id uuid not null references public.dynamics(id),
 registration_id uuid not null references public.registrations(id),
 status text not null default 'completed',
 points_awarded integer not null default 0,
 metadata jsonb not null default '{}',
 completed_at timestamptz,
 unique (dynamic_id,registration_id)
);
do $$ begin
  if not exists (select from pg_roles where rolname='service_role') then create role service_role; end if;
  if not exists (select from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;

\ir ../migrations/20261017143500_event_mechanics.sql

do $check$
declare
 ev uuid; a uuid; b uuid; c uuid; d uuid; dr uuid; dt uuid; team uuid;
 x jsonb; y jsonb; v_run_id uuid; failed boolean; n integer;
begin
 assert not has_function_privilege('anon', 'public.dynamic_wheel_spin(uuid,uuid,uuid)','execute'),
   'anonymous users cannot spin';
 assert not has_function_privilege('authenticated', 'public.dynamic_trivia_answer(uuid,uuid,uuid,integer)','execute'),
   'public clients cannot answer';
 assert has_function_privilege('service_role','public.dynamic_timed_command(uuid,uuid,text,uuid,uuid[],text,uuid,bigint,text,text)','execute'),
   'edge function can use the timed RPC';
 insert into public.events(code) values('TEST') returning id into ev;
 insert into public.registrations(event_id) values(ev) returning id into a;
 insert into public.registrations(event_id) values(ev) returning id into b;
 insert into public.registrations(event_id) values(ev) returning id into c;

 insert into public.dynamics(event_id,name,type,status,requires_checkin,config,prize,winner_count)
 values(ev,'Test chrono','challenge','open',false,
 '{"challenge_mode":"timed_max","pending_review":false}','reward',1) returning id into d;
 x:=public.dynamic_timed_command(ev,d,'start',a);
 v_run_id:=(x->>'id')::uuid;
 assert x->>'status'='running', 'timer starts';
 perform pg_sleep(0.02);
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'pause',p_run_id=>v_run_id);
 assert x->>'status'='paused' and (x->>'elapsed_ms')::bigint>0,'timer pauses and saves time';
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'resume',p_run_id=>v_run_id);
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'finish',p_run_id=>v_run_id);
 assert x->>'status'='finished','timer finishes';
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'correct',
 p_run_id=>v_run_id,p_correct_ms=>12730,p_reason=>'test correction',p_actor=>'qa');
 assert (x->>'elapsed_ms')::bigint=12730,'correction persists';
 assert exists(select 1 from public.dynamic_timed_corrections tc where tc.run_id=v_run_id),'correction audited';
 begin
   perform public.dynamic_timed_command(ev,d,'start',a);
   failed:=false;
 exception when others then failed:=sqlerrm='mechanic_already_entered';
 end;
 assert failed,'duplicate runner is rejected';

 -- Tie at the cut-off must block prize allocation.
 x:=public.dynamic_timed_command(ev,d,'start',b);
 v_run_id:=(x->>'id')::uuid;
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'finish',p_run_id=>v_run_id);
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'correct',
   p_run_id=>v_run_id,p_correct_ms=>12730,p_reason=>'tie simulation',p_actor=>'qa');
 begin
   perform public.dynamic_timed_finalize(ev,d);
   failed:=false;
 exception when others then failed:=sqlerrm='mechanic_tie_unresolved';
 end;
 assert failed,'ties crossing prize boundary must be resolved';
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>d,p_command=>'correct',
   p_run_id=>v_run_id,p_correct_ms=>11000,p_reason=>'tie resolved by official review',p_actor=>'qa');
 x:=public.dynamic_timed_finalize(ev,d);
 assert (x->>'winners')::integer=1,'only the champion wins';
 assert (select status from public.dynamics where id=d)='completed','ranking finalized';
 assert (select count(*) from public.dynamic_participations where dynamic_id=d and status='winner')=1,
   'prize is reflected in event historical results';
 begin
   perform public.dynamic_timed_finalize(ev,d);
   failed:=false;
 exception when others then failed:=sqlerrm='mechanic_not_open';
 end;
 assert failed,'a finalized ranking cannot be executed again';


 insert into public.dynamics(event_id,name,type,status,requires_checkin,config,prize,winner_count)
 values(ev,'Test relay','challenge','open',false,
 '{"challenge_mode":"team_relay","pending_review":false}','reward',2) returning id into team;
 x:=public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>team,p_command=>'start',
 p_registration_id=>a,p_member_ids=>array[a,b],p_team_name=>'Los Rápidos');
 assert x->>'team_name'='Los Rápidos','relay with roster starts';
 begin
  perform public.dynamic_timed_command(p_event_id=>ev,p_dynamic_id=>team,p_command=>'start',
   p_registration_id=>b,p_member_ids=>array[b,c],p_team_name=>'Duplicado');
  failed:=false;
 exception when others then failed:=sqlerrm='mechanic_already_entered';
 end;
 assert failed,'a runner cannot join two teams';

 insert into public.dynamics(event_id,name,type,status,requires_checkin,config,prize,winner_count)
 values(ev,'Test wheel','raffle','open',false,
 '{"mechanic":"wheel","pending_review":false,"wheel_probability":1,"wheel_prizes":[{"id":"one","label":"TEST PRIZE","quantity":1,"weight":1}]}',
 'reward',1) returning id into dr;
 x:=public.dynamic_wheel_spin(ev,dr,a);
 assert x->>'won'='true' and x->>'prize'='TEST PRIZE','first spinner wins existing stock';
 y:=public.dynamic_wheel_spin(ev,dr,a);
 assert y->>'already_played'='true','repeat spin returns saved outcome';
 y:=public.dynamic_wheel_spin(ev,dr,b);
 assert y->>'won'='false','empty stock cannot be awarded';
 select count(*) into n from public.dynamic_wheel_spins where dynamic_id=dr and prize_key='one';
 assert n=1,'stock is never exceeded';
 select count(*) into n from public.dynamic_participations where dynamic_id=dr and status='winner';
 assert n=1,'winner is reflected in existing results';

 insert into public.dynamics(event_id,name,type,status,requires_checkin,config,prize,winner_count)
 values(ev,'Test quiz','trivia','open',false,
 '{"pending_review":false,"trivia_question":"Test?","trivia_options":["No","Yes"],"trivia_correct_index":1}',
 'reward',1) returning id into dt;
 x:=public.dynamic_trivia_answer(ev,dt,a,1);
 assert x->>'correct'='true' and x->>'won'='true','correct answer awards first prize';
 x:=public.dynamic_trivia_answer(ev,dt,b,1);
 assert x->>'correct'='true' and x->>'won'='false','max winners enforced';
 y:=public.dynamic_trivia_answer(ev,dt,a,0);
 assert y->>'already_played'='true','second answer rejected';
 x:=public.dynamic_trivia_answer(ev,dt,c,0);
 assert x->>'correct'='false' and x->>'won'='false','wrong answer cannot award a prize';
end
$check$;
