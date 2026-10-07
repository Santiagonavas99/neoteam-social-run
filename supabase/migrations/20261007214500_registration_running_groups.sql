insert into public.running_groups (
  name, slug, invited, active, sort_order, show_on_home
)
values
  ('United Runner Club', 'united-runner-club', false, true, 8, false),
  ('Neo Team', 'neoteam', false, true, 10, false)
on conflict (slug) do nothing;

with target_event as (
  select id
  from public.events
  where code = 'SR26'
  limit 1
),
neo as (
  select id
  from public.running_groups
  where slug = 'neoteam' and active is true
  limit 1
)
update public.registrations r
set
  running_group_id = neo.id,
  other_running_group = null,
  updated_at = now()
from target_event e, neo
where r.event_id = e.id
  and r.source = 'web'
  and r.running_group_id is null
  and nullif(trim(r.other_running_group), '') is null;

with target_event as (
  select id
  from public.events
  where code = 'SR26'
  limit 1
)
update public.registrations r
set
  running_group_id = rg.id,
  other_running_group = null,
  updated_at = now()
from target_event e, public.running_groups rg
where r.event_id = e.id
  and r.running_group_id is null
  and nullif(trim(r.other_running_group), '') is not null
  and rg.active is true
  and lower(trim(r.other_running_group)) = lower(trim(rg.name));

create or replace function public.register_social_run_participant(
  p_first_name text,
  p_last_name text,
  p_document_type text,
  p_document_number text,
  p_email text,
  p_phone text,
  p_birth_date date,
  p_running_group_slug text,
  p_other_running_group text,
  p_emergency_name text,
  p_emergency_phone text,
  p_terms_accepted boolean,
  p_privacy_accepted boolean,
  p_marketing_accepted boolean default false,
  p_gender text default null
)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event_id uuid;
  v_group_id uuid;
  v_code text;
  v_other_group text;
  v_group_slug text;
begin
  if coalesce(trim(p_first_name), '') = '' or char_length(trim(p_first_name)) > 80 then
    raise exception 'Nombre inválido';
  end if;
  if coalesce(trim(p_last_name), '') = '' or char_length(trim(p_last_name)) > 80 then
    raise exception 'Apellido inválido';
  end if;
  if p_document_type not in ('CC','TI','CE','PA','PPT','OTRO') then
    raise exception 'Tipo de documento inválido';
  end if;
  if char_length(trim(coalesce(p_document_number, ''))) < 5 or char_length(trim(p_document_number)) > 30 then
    raise exception 'Documento inválido';
  end if;
  if position('@' in coalesce(p_email, '')) < 2 or char_length(trim(p_email)) > 160 then
    raise exception 'Correo inválido';
  end if;
  if char_length(trim(coalesce(p_phone, ''))) < 7 or char_length(trim(p_phone)) > 30 then
    raise exception 'Teléfono inválido';
  end if;
  if p_birth_date is null or p_birth_date > current_date then
    raise exception 'Fecha de nacimiento inválida';
  end if;
  if char_length(trim(coalesce(p_emergency_name, ''))) < 2 or char_length(trim(p_emergency_name)) > 120 then
    raise exception 'Contacto de emergencia inválido';
  end if;
  if char_length(trim(coalesce(p_emergency_phone, ''))) < 7 or char_length(trim(p_emergency_phone)) > 30 then
    raise exception 'Teléfono de emergencia inválido';
  end if;
  if p_gender is null or p_gender not in ('female','male') then
    raise exception 'Categoría inválida';
  end if;
  if p_terms_accepted is not true or p_privacy_accepted is not true then
    raise exception 'Debes aceptar los términos y el tratamiento de datos';
  end if;

  select e.id into v_event_id
  from public.events e
  where e.code = 'SR26'
    and e.registration_open is true
    and e.status in ('published','draft')
  limit 1;

  if v_event_id is null then
    raise exception 'Las inscripciones no están disponibles';
  end if;

  v_group_slug := lower(trim(coalesce(p_running_group_slug, '')));

  if v_group_slug = 'otro' then
    v_group_id := null;
    v_other_group := nullif(trim(coalesce(p_other_running_group, '')), '');
    if v_other_group is null or char_length(v_other_group) > 120 then
      raise exception 'Escribe el nombre de tu grupo';
    end if;
  else
    select rg.id into v_group_id
    from public.running_groups rg
    where rg.slug = v_group_slug
      and rg.active is true
    limit 1;

    if v_group_id is null then
      raise exception 'Grupo de running inválido';
    end if;

    v_other_group := null;
  end if;

  insert into public.registrations (
    event_id,
    first_name,
    last_name,
    document_type,
    document_number,
    email,
    phone,
    birth_date,
    gender,
    running_group_id,
    other_running_group,
    emergency_name,
    emergency_phone,
    terms_accepted,
    privacy_accepted,
    marketing_accepted,
    source
  ) values (
    v_event_id,
    trim(p_first_name),
    trim(p_last_name),
    p_document_type,
    trim(p_document_number),
    lower(trim(p_email)),
    trim(p_phone),
    p_birth_date,
    p_gender,
    v_group_id,
    v_other_group,
    trim(p_emergency_name),
    trim(p_emergency_phone),
    true,
    true,
    coalesce(p_marketing_accepted, false),
    'web'
  )
  returning registration_code into v_code;

  return v_code;
exception
  when unique_violation then
    raise exception 'Ya existe una inscripción con ese documento o correo';
end;
$function$;

revoke all on function public.register_social_run_participant(
  text, text, text, text, text, text, date, text, text, text, text,
  boolean, boolean, boolean, text
) from public;

revoke execute on function public.register_social_run_participant(
  text, text, text, text, text, text, date, text, text, text, text,
  boolean, boolean, boolean, text
) from authenticated;

grant execute on function public.register_social_run_participant(
  text, text, text, text, text, text, date, text, text, text, text,
  boolean, boolean, boolean, text
) to anon, service_role;
