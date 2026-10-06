\ir ../migrations/20261003220000_admin_pin_access.sql

do $$
begin
  assert (select relrowsecurity from pg_class where oid = 'public.admin_pin_attempts'::regclass),
    'RLS must be enabled on admin_pin_attempts';
  assert not has_table_privilege('anon', 'public.admin_pin_settings', 'select'),
    'anon must not read admin_pin_settings';
end $$;
