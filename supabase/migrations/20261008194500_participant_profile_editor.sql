-- Atomic, admin-only participant corrections. No personal values are retained in the audit.
create table if not exists public.registration_profile_edits (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  admin_user_id uuid not null references public.admin_users(id),
  fields_changed text[] not null,
  created_at timestamptz not null default now()
);
alter table public.registration_profile_edits enable row level security;
revoke all on public.registration_profile_edits from PUBLIC, anon, authenticated;
create index if not exists registration_profile_edits_registration_idx
  on public.registration_profile_edits(registration_id, created_at desc);

create or replace function public.admin_update_registration_profile(
  p_event_id uuid,
  p_registration_id uuid,
  p_admin_user_id uuid,
  p_expected_updated_at timestamptz,
  p_profile jsonb
) returns text language plpgsql security definer
set search_path = '' as $$
declare
  prior public.registrations%rowtype;
  changed text[] := array[]::text[];
  column_name text;
  candidate text;
  allowed text[] := array[
    'first_name','last_name','document_type','document_number','email','phone',
    'birth_date','gender','running_group_id','other_running_group','shirt_size',
    'emergency_name','emergency_phone'
  ];
  email_changed boolean;
begin
  if p_profile is null or jsonb_typeof(p_profile) <> 'object'
     or (select count(*) from jsonb_object_keys(p_profile)) <> array_length(allowed, 1)
     or exists (select 1 from jsonb_object_keys(p_profile) k where k <> all(allowed))
     or exists (select 1 from unnest(allowed) k where not p_profile ? k)
  then
    return 'invalid_fields';
  end if;

  select * into prior from public.registrations
    where id = p_registration_id and event_id = p_event_id for update;
  if not found then return 'not_found'; end if;
  if prior.updated_at is distinct from p_expected_updated_at then return 'stale'; end if;
  if not exists (select 1 from public.admin_users where id = p_admin_user_id and role = 'admin' and active)
    then return 'not_allowed'; end if;
  if p_profile->>'running_group_id' is not null and not exists (
    select 1 from public.running_groups where id = (p_profile->>'running_group_id')::uuid
  ) then return 'invalid_group'; end if;

  foreach column_name in array allowed loop
    case column_name
      when 'birth_date' then
        candidate := nullif(p_profile->>column_name, '');
        if prior.birth_date is distinct from candidate::date then changed := array_append(changed, column_name); end if;
      when 'running_group_id' then
        candidate := nullif(p_profile->>column_name, '');
        if prior.running_group_id is distinct from candidate::uuid then changed := array_append(changed, column_name); end if;
      else
        execute format('select ($1).%I::text', column_name) into candidate using prior;
        if candidate is distinct from nullif(p_profile->>column_name, '') then
          changed := array_append(changed, column_name);
        end if;
    end case;
  end loop;
  if array_length(changed, 1) is null then return 'unchanged'; end if;

  email_changed := prior.email is distinct from p_profile->>'email';
  update public.registrations set
    first_name = p_profile->>'first_name',
    last_name = p_profile->>'last_name',
    document_type = p_profile->>'document_type',
    document_number = p_profile->>'document_number',
    email = p_profile->>'email',
    phone = p_profile->>'phone',
    birth_date = nullif(p_profile->>'birth_date', '')::date,
    gender = p_profile->>'gender',
    running_group_id = nullif(p_profile->>'running_group_id', '')::uuid,
    other_running_group = nullif(p_profile->>'other_running_group', ''),
    shirt_size = nullif(p_profile->>'shirt_size', ''),
    emergency_name = p_profile->>'emergency_name',
    emergency_phone = p_profile->>'emergency_phone',
    pass_emailed_at = case when email_changed then null else pass_emailed_at end,
    pass_email_last_error = case when email_changed then null else pass_email_last_error end,
    updated_at = clock_timestamp()
  where id = p_registration_id and event_id = p_event_id;

  insert into public.registration_profile_edits(event_id,registration_id,admin_user_id,fields_changed)
  values (p_event_id,p_registration_id,p_admin_user_id,changed);
  return case when email_changed then 'email_changed' else 'updated' end;
end $$;
revoke all on function public.admin_update_registration_profile(uuid,uuid,uuid,timestamptz,jsonb)
 from PUBLIC, anon, authenticated;
grant execute on function public.admin_update_registration_profile(uuid,uuid,uuid,timestamptz,jsonb)
 to service_role;
