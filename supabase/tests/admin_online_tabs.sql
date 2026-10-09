\ir ../migrations/20261003220000_admin_pin_access.sql
\ir ../migrations/20261006150000_admin_users.sql
\ir ../migrations/20261009183000_admin_online_tabs.sql
\ir ../migrations/20261009183000_admin_online_tabs.sql

insert into public.admin_users (name,email,role)
values ('Admin A','admin-a@example.com','admin'),('Admin B','admin-b@example.com','admin');

insert into public.admin_pin_sessions (token_hash,expires_at,user_id)
select 'session-' || id::text,now()+interval '1 day',id from public.admin_users;

insert into public.admin_online_tabs(session_id,tab_id,user_id)
select s.id, '11111111-1111-4111-8111-111111111111', s.user_id
from public.admin_pin_sessions s limit 1;

do $$
begin
 assert (select count(*) from public.admin_online_tabs) = 1, 'tab not inserted';
 assert (select relrowsecurity from pg_class where oid='public.admin_online_tabs'::regclass),
   'presence rows must have RLS';
 assert not has_table_privilege('anon','public.admin_online_tabs','select'),
   'anonymous clients must not read active administrators';
 assert not has_table_privilege('authenticated','public.admin_online_tabs','select'),
   'authenticated public clients must not read active administrators';
 assert not has_table_privilege('anon','public.admin_online_tabs','insert'),
   'anonymous clients must not create online administrators';
 delete from public.admin_pin_sessions where id in (select session_id from public.admin_online_tabs);
 assert (select count(*) from public.admin_online_tabs) = 0,
   'logout/revocation must cascade to presence rows';
end $$;
