alter table public.registrations
  add column if not exists checkin_token uuid not null default gen_random_uuid();

create unique index if not exists registrations_checkin_token_key
  on public.registrations(checkin_token);
