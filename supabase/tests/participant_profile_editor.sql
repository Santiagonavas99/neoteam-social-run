create table public.events(id uuid primary key default gen_random_uuid());
create table public.running_groups(id uuid primary key default gen_random_uuid());
create table public.admin_users(
  id uuid primary key default gen_random_uuid(),
  role text not null default 'admin',
  active boolean not null default true
);
create table public.registrations(
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  first_name text not null, last_name text not null,
  document_type text not null, document_number text not null,
  email text not null, phone text not null,
  birth_date date, gender text not null, running_group_id uuid,
  other_running_group text, shirt_size text,
  emergency_name text not null, emergency_phone text not null,
  pass_emailed_at timestamptz,
  pass_email_last_error text,
  updated_at timestamptz not null default now(),
  unique(event_id, document_number), unique(event_id,email)
);
\ir ../migrations/20261008194500_participant_profile_editor.sql
\ir ../migrations/20261008194500_participant_profile_editor.sql
do $$
declare
  evt uuid;
  actor uuid;
  person uuid;
  original_stamp timestamptz;
  new_stamp timestamptz;
  info jsonb;
  outcome text;
begin
  insert into public.events default values returning id into evt;
  insert into public.admin_users default values returning id into actor;
  insert into public.registrations(
    event_id,first_name,last_name,document_type,document_number,email,phone,
    birth_date,gender,shirt_size,emergency_name,emergency_phone,pass_emailed_at
  ) values (
    evt,'Ana','Ruiz','CC','12345678','ana@example.com','3001234567',
    '2000-01-01','female','M','Contacto','3007654321',now()
  ) returning id,updated_at into person,original_stamp;
  info := jsonb_build_object(
    'first_name','Ana','last_name','Ruiz','document_type','CC',
    'document_number','12345678','email','ana@example.com','phone','3002222222',
    'birth_date','2000-01-01','gender','female','running_group_id',null,
    'other_running_group',null,'shirt_size','M',
    'emergency_name','Contacto','emergency_phone','3007654321'
  );
  outcome := public.admin_update_registration_profile(evt,person,actor,original_stamp,info);
  assert outcome = 'updated', 'profile must update';
  assert (select pass_emailed_at is not null from public.registrations where id=person),
    'non-email edits must preserve pass';
  assert (select fields_changed = array['phone'] from public.registration_profile_edits where registration_id=person),
    'audit records names only';
  outcome := public.admin_update_registration_profile(evt,person,actor,original_stamp,info);
  assert outcome = 'stale', 'older revisions cannot overwrite';
  select updated_at into new_stamp from public.registrations where id=person;
  info := jsonb_set(info,'{email}','"ana.corrected@example.com"');
  outcome := public.admin_update_registration_profile(evt,person,actor,new_stamp,info);
  assert outcome = 'email_changed', 'email update must report new pending pass';
  assert (select pass_emailed_at is null from public.registrations where id=person),
    'email correction must reset pass_emailed_at';
  assert (select count(*) from public.registration_profile_edits where registration_id=person)=2,
    'both changes audited';
  assert not has_table_privilege('anon','public.registration_profile_edits','select'),
    'audit is private';
end $$;
