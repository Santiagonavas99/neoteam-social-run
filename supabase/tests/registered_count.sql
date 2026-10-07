-- events and registrations exist only on the remote; minimal stand-ins with the columns the function reads.
create table public.events (id uuid primary key default gen_random_uuid(), code text);
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id),
  status text
);
alter table public.registrations enable row level security;
revoke all on table public.registrations from anon, authenticated;

\ir ../migrations/20261007020000_registered_count.sql
\ir ../migrations/20261007020000_registered_count.sql

insert into public.events (code) values ('SR26'), ('OTHER');
insert into public.registrations (event_id, status)
select id, s from public.events, unnest(array['registered', 'checked_in', 'cancelled']) s;

set role anon;
do $$
begin
  assert public.social_run_registered_count() = 2,
    'counts SR26 registrations that are not cancelled';
  assert not has_table_privilege('anon', 'public.registrations', 'select'),
    'anon must not read registrations';
end $$;
reset role;
