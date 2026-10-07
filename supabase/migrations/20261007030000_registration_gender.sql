-- Adds the runner's category (registrations.gender) to the public registration RPC.
-- The body is the remote definition of 2026-10-07 plus p_gender; the new parameter
-- defaults to null, so callers that do not send it keep working.
drop function public.register_social_run_participant(
  text, text, text, text, text, text, date, text, text, text, text, boolean, boolean, boolean
);

create function public.register_social_run_participant(p_first_name text, p_last_name text, p_document_type text, p_document_number text, p_email text, p_phone text, p_birth_date date, p_running_group_slug text, p_other_running_group text, p_emergency_name text, p_emergency_phone text, p_terms_accepted boolean, p_privacy_accepted boolean, p_marketing_accepted boolean DEFAULT false, p_gender text DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event_id uuid;
  v_group_id uuid;
  v_code text;
  v_other_group text;
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
  if p_gender is not null and p_gender not in ('female','male','other') then
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

  if p_running_group_slug in ('neoteam','independiente') then
    select rg.id into v_group_id
    from public.running_groups rg
    where rg.slug = p_running_group_slug and rg.active is true
    limit 1;
    v_other_group := null;
  else
    v_group_id := null;
    v_other_group := nullif(trim(coalesce(p_other_running_group, '')), '');
    if v_other_group is null or char_length(v_other_group) > 120 then
      raise exception 'Escribe el nombre de tu grupo';
    end if;
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
  text, text, text, text, text, text, date, text, text, text, text, boolean, boolean, boolean, text
) from public;
grant execute on function public.register_social_run_participant(
  text, text, text, text, text, text, date, text, text, text, text, boolean, boolean, boolean, text
) to anon, service_role;
