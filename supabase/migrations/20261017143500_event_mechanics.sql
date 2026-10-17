-- Event mechanics. No existing participation, authentication or draw records are rewritten.
create table if not exists public.dynamic_timed_runs (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.dynamics(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  team_name text,
  member_ids uuid[] not null default '{}',
  status text not null default 'running' check (status in ('running','paused','finished')),
  elapsed_ms bigint not null default 0 check (elapsed_ms >= 0 and elapsed_ms <= 43200000),
  running_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dynamic_id, registration_id)
);
create unique index if not exists dynamic_timed_teams_name_unique on public.dynamic_timed_runs(dynamic_id,lower(team_name)) where team_name is not null;
create index if not exists dynamic_timed_ranking on public.dynamic_timed_runs(dynamic_id,status,elapsed_ms);
create table if not exists public.dynamic_timed_corrections (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.dynamic_timed_runs(id) on delete cascade,
  old_ms bigint not null,
  new_ms bigint not null,
  reason text not null,
  changed_by text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.dynamic_wheel_spins (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.dynamics(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  prize_key text,
  prize_label text,
  created_at timestamptz not null default now(),
  unique (dynamic_id, registration_id)
);
create index if not exists dynamic_wheel_stock on public.dynamic_wheel_spins(dynamic_id, prize_key);
create table if not exists public.dynamic_trivia_answers (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.dynamics(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  choice_index integer not null check (choice_index between 0 and 7),
  correct boolean not null,
  won boolean not null default false,
  created_at timestamptz not null default now(),
  unique (dynamic_id, registration_id)
);
create index if not exists dynamic_trivia_winners on public.dynamic_trivia_answers(dynamic_id, correct, won);

alter table public.dynamic_timed_runs enable row level security;
alter table public.dynamic_timed_corrections enable row level security;
alter table public.dynamic_wheel_spins enable row level security;
alter table public.dynamic_trivia_answers enable row level security;
revoke all on public.dynamic_timed_runs, public.dynamic_timed_corrections, public.dynamic_wheel_spins, public.dynamic_trivia_answers from public,anon,authenticated;
grant all on public.dynamic_timed_runs, public.dynamic_timed_corrections, public.dynamic_wheel_spins, public.dynamic_trivia_answers to service_role;

-- Authorized edge function uses service_role. Rows are serialized on dynamics.id.
create or replace function public.dynamic_timed_command(
  p_event_id uuid, p_dynamic_id uuid, p_command text,
  p_registration_id uuid default null, p_member_ids uuid[] default '{}',
  p_team_name text default null, p_run_id uuid default null,
  p_correct_ms bigint default null, p_reason text default null, p_actor text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  d record; r public.dynamic_timed_runs%rowtype; members uuid[];
  v_mode text; v_now timestamptz; v_elapsed bigint; v_count integer;
begin
  select * into d from public.dynamics where id=p_dynamic_id and event_id=p_event_id for update;
  if not found then raise exception 'mechanic_not_found'; end if;
  v_mode := d.config->>'challenge_mode';
  if d.type <> 'challenge' or v_mode not in ('timed_max','timed_min','team_relay') then
    raise exception 'mechanic_not_timed';
  end if;
  if d.status <> 'open' then raise exception 'mechanic_not_open'; end if;
  if d.config->>'pending_review' = 'true' then raise exception 'mechanic_not_reviewed'; end if;
  v_now := clock_timestamp();
  if p_command = 'start' then
    members := case when v_mode='team_relay' then p_member_ids else array[p_registration_id] end;
    if p_registration_id is null or members is null or array_length(members,1) is null then
      raise exception 'mechanic_members_required';
    end if;
    if v_mode='team_relay' and (char_length(trim(coalesce(p_team_name,''))) < 2 or array_length(members,1) < 2) then
      raise exception 'mechanic_team_required';
    end if;
    if v_mode<>'team_relay' and p_team_name is not null then raise exception 'mechanic_invalid_team'; end if;
    if not p_registration_id = any(members) then raise exception 'mechanic_invalid_members'; end if;
    select count(distinct x) into v_count from unnest(members) x;
    if v_count <> array_length(members,1) then raise exception 'mechanic_duplicate_members'; end if;
    select count(*) into v_count from public.registrations r0
      where r0.id=any(members) and r0.event_id=p_event_id
      and r0.status <> 'cancelled'
      and (not d.requires_checkin or r0.status='checked_in');
    if v_count <> array_length(members,1) then raise exception 'mechanic_ineligible_member'; end if;
    if exists (select 1 from public.dynamic_timed_runs old, unnest(old.member_ids) old_member
      where old.dynamic_id=p_dynamic_id and old_member=any(members)) then
      raise exception 'mechanic_already_entered';
    end if;
    insert into public.dynamic_timed_runs(dynamic_id,registration_id,team_name,member_ids,status,running_at)
    values(p_dynamic_id,p_registration_id,case when v_mode='team_relay' then trim(p_team_name) else null end,
      members,'running',v_now) returning * into r;
  else
    select * into r from public.dynamic_timed_runs where id=p_run_id and dynamic_id=p_dynamic_id for update;
    if not found then raise exception 'mechanic_run_not_found'; end if;
    if p_command in ('pause','finish') then
      if r.status<>'running' or r.running_at is null then raise exception 'mechanic_not_running'; end if;
      v_elapsed := r.elapsed_ms + greatest(0, floor(extract(epoch from (v_now-r.running_at))*1000))::bigint;
      if v_elapsed > 43200000 then raise exception 'mechanic_duration_limit'; end if;
      update public.dynamic_timed_runs
        set elapsed_ms=v_elapsed, running_at=null,
        status=case when p_command='finish' then 'finished' else 'paused' end,
        updated_at=v_now where id=r.id returning * into r;
    elsif p_command='resume' then
      if r.status<>'paused' then raise exception 'mechanic_not_paused'; end if;
      update public.dynamic_timed_runs set status='running',running_at=v_now,updated_at=v_now
      where id=r.id returning * into r;
    elsif p_command='correct' then
      if r.status<>'finished' or p_correct_ms is null or p_correct_ms<0 or p_correct_ms>43200000
        or char_length(trim(coalesce(p_reason,'')))<8 then
        raise exception 'mechanic_invalid_correction';
      end if;
      insert into public.dynamic_timed_corrections(run_id,old_ms,new_ms,reason,changed_by)
        values(r.id,r.elapsed_ms,p_correct_ms,trim(p_reason),coalesce(p_actor,'unknown'));
      update public.dynamic_timed_runs set elapsed_ms=p_correct_ms,updated_at=v_now
        where id=r.id returning * into r;
    else
      raise exception 'mechanic_invalid_action';
    end if;
  end if;
  return jsonb_build_object('id',r.id,'status',r.status,'elapsed_ms',r.elapsed_ms,
    'running_at',r.running_at,'team_name',r.team_name,'registration_id',r.registration_id,
    'member_ids',r.member_ids);
end $$;

create or replace function public.dynamic_wheel_spin(
  p_event_id uuid,p_dynamic_id uuid,p_registration_id uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  d record; entry record; item jsonb; opts jsonb; winner text; key text;
  total_weight numeric:=0; cursor_weight numeric:=0; chosen numeric; probability numeric;
  qty integer; used integer; v_roll numeric; bytes bytea; eligible boolean;
begin
  select * into d from public.dynamics where id=p_dynamic_id and event_id=p_event_id for update;
  if not found then raise exception 'mechanic_not_found'; end if;
  if d.type<>'raffle' or d.config->>'mechanic'<>'wheel' then raise exception 'mechanic_not_wheel'; end if;
  if d.status<>'open' then raise exception 'mechanic_not_open'; end if;
  if d.config->>'pending_review'='true' then raise exception 'mechanic_not_reviewed'; end if;
  select * into entry from public.dynamic_wheel_spins
    where dynamic_id=p_dynamic_id and registration_id=p_registration_id;
  if found then
    return jsonb_build_object('already_played',true,'won',entry.prize_key is not null,
      'prize',entry.prize_label);
  end if;
  select exists(select 1 from public.registrations r
    where r.id=p_registration_id and r.event_id=p_event_id and r.status<>'cancelled'
    and (not d.requires_checkin or r.status='checked_in')) into eligible;
  if not eligible then raise exception 'mechanic_ineligible_member'; end if;
  if d.config->>'exclude_winners'='true' and exists (
    select 1 from public.dynamic_participations dp
    join public.dynamics other on other.id=dp.dynamic_id
    where dp.registration_id=p_registration_id and dp.status='winner'
      and other.event_id=p_event_id
  ) then raise exception 'mechanic_prior_winner'; end if;
  opts:=d.config->'wheel_prizes';
  if jsonb_typeof(opts) <> 'array' or jsonb_array_length(opts)=0 then
    raise exception 'mechanic_configuration_missing';
  end if;
  probability := coalesce((d.config->>'wheel_probability')::numeric,1);
  if probability < 0 or probability > 1 then raise exception 'mechanic_configuration_missing'; end if;
  -- Database-side secure uniform selection from 32 bits of pgcrypto entropy.
  bytes := extensions.gen_random_bytes(4);
  v_roll := (get_byte(bytes,0)::numeric*16777216 + get_byte(bytes,1)*65536 +
    get_byte(bytes,2)*256 + get_byte(bytes,3))/4294967296::numeric;
  if v_roll < probability then
    for item in select value from jsonb_array_elements(opts) loop
      key:=item->>'id';
      qty:=coalesce((item->>'quantity')::integer,0);
      if key is null or length(key)>60 or length(coalesce(item->>'label',''))<1
        or qty<0 or qty>500 then raise exception 'mechanic_configuration_missing'; end if;
      select count(*) into used from public.dynamic_wheel_spins
        where dynamic_id=p_dynamic_id and prize_key=key;
      if used<qty then
        total_weight:=total_weight+coalesce((item->>'weight')::numeric,1);
      end if;
    end loop;
    if total_weight > 0 then
      bytes := extensions.gen_random_bytes(4);
      chosen := ((get_byte(bytes,0)::numeric*16777216 + get_byte(bytes,1)*65536 +
        get_byte(bytes,2)*256 + get_byte(bytes,3))/4294967296::numeric)*total_weight;
      for item in select value from jsonb_array_elements(opts) loop
        key:=item->>'id';
        qty:=coalesce((item->>'quantity')::integer,0);
        select count(*) into used from public.dynamic_wheel_spins
          where dynamic_id=p_dynamic_id and prize_key=key;
        if used<qty then
          cursor_weight:=cursor_weight+coalesce((item->>'weight')::numeric,1);
          if chosen<cursor_weight then
            winner:=item->>'label'; exit;
          end if;
        end if;
      end loop;
    end if;
  end if;
  insert into public.dynamic_wheel_spins(dynamic_id,registration_id,prize_key,prize_label)
    values(p_dynamic_id,p_registration_id,case when winner is null then null else key end,winner);
  insert into public.dynamic_participations(dynamic_id,registration_id,status,points_awarded,metadata)
    values(p_dynamic_id,p_registration_id,case when winner is null then 'entered' else 'winner' end,0,
      jsonb_build_object('mechanic','wheel','prize',winner))
    on conflict (dynamic_id,registration_id) do nothing;
  return jsonb_build_object('already_played',false,'won',winner is not null,'prize',winner);
end $$;

create or replace function public.dynamic_trivia_answer(
  p_event_id uuid,p_dynamic_id uuid,p_registration_id uuid,p_choice integer
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  d record; entry record; correct_index integer; right_answer boolean; award boolean:=false;
  existing_winners integer; eligible boolean; opts jsonb;
begin
  select * into d from public.dynamics where id=p_dynamic_id and event_id=p_event_id for update;
  if not found then raise exception 'mechanic_not_found'; end if;
  if d.type<>'trivia' then raise exception 'mechanic_not_trivia'; end if;
  if d.status<>'open' then raise exception 'mechanic_not_open'; end if;
  if d.config->>'pending_review'='true' then raise exception 'mechanic_not_reviewed'; end if;
  select * into entry from public.dynamic_trivia_answers
    where dynamic_id=p_dynamic_id and registration_id=p_registration_id;
  if found then
    return jsonb_build_object('already_played',true,'correct',entry.correct,'won',entry.won);
  end if;
  select exists(select 1 from public.registrations r where r.id=p_registration_id
    and r.event_id=p_event_id and r.status<>'cancelled'
    and (not d.requires_checkin or r.status='checked_in')) into eligible;
  if not eligible then raise exception 'mechanic_ineligible_member'; end if;
  opts:=d.config->'trivia_options';
  correct_index:=(d.config->>'trivia_correct_index')::integer;
  if jsonb_typeof(opts)<>'array' or jsonb_array_length(opts)<2 or
    correct_index<0 or correct_index>=jsonb_array_length(opts) or
    p_choice<0 or p_choice>=jsonb_array_length(opts) then
    raise exception 'mechanic_configuration_missing';
  end if;
  right_answer:=(p_choice=correct_index);
  select count(*) into existing_winners from public.dynamic_trivia_answers
    where dynamic_id=p_dynamic_id and won=true;
  award:=right_answer and existing_winners<d.winner_count;
  if award and d.config->>'exclude_winners'='true' and exists (
    select 1 from public.dynamic_participations dp
      join public.dynamics other on other.id=dp.dynamic_id
      where dp.registration_id=p_registration_id and dp.status='winner'
        and other.event_id=p_event_id
  ) then award:=false; end if;
  insert into public.dynamic_trivia_answers(dynamic_id,registration_id,choice_index,correct,won)
    values(p_dynamic_id,p_registration_id,p_choice,right_answer,award);
  insert into public.dynamic_participations(dynamic_id,registration_id,status,points_awarded,metadata)
    values(p_dynamic_id,p_registration_id,case when award then 'winner' else 'entered' end,0,
      jsonb_build_object('mechanic','trivia','correct',right_answer))
    on conflict (dynamic_id,registration_id) do nothing;
  return jsonb_build_object('already_played',false,'correct',right_answer,'won',award);
end $$;

revoke all on function public.dynamic_timed_command(uuid,uuid,text,uuid,uuid[],text,uuid,bigint,text,text) from public,anon,authenticated;
revoke all on function public.dynamic_wheel_spin(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.dynamic_trivia_answer(uuid,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.dynamic_timed_command(uuid,uuid,text,uuid,uuid[],text,uuid,bigint,text,text) to service_role;
grant execute on function public.dynamic_wheel_spin(uuid,uuid,uuid) to service_role;
grant execute on function public.dynamic_trivia_answer(uuid,uuid,uuid,integer) to service_role;

-- Preserve all 15 drafts and historical results. Only annotate identified drafts.
update public.dynamics set
  config=jsonb_set(config,'{challenge_mode}','"timed_max"'::jsonb,true)
  where status='draft' and config->>'social_run_plan_key' in
    ('social-run-2026-10-18-musasg-isometricas','social-run-2026-10-18-kuulmax-planchas');
update public.dynamics set
  config=jsonb_set(config,'{challenge_mode}','"team_relay"'::jsonb,true)
  where status='draft' and config->>'social_run_plan_key'='social-run-2026-10-18-toxic-relevos';
update public.dynamics set
  config=jsonb_set(config,'{mechanic}','"wheel"'::jsonb,true)
  where status='draft' and config->>'social_run_plan_key' in
    ('social-run-2026-10-18-mmtulua-ruleta',
     'social-run-2026-10-18-juancho-ruleta',
     'social-run-2026-10-18-highforce-ruleta');
-- Prize quantities and trivia correct answers must be confirmed in the admin.
-- pending_review remains true; no activation is performed.
