\ir ../migrations/20261003220000_admin_pin_access.sql
\ir ../migrations/20261006090000_admin_pin_atomic_attempts.sql

do $$
declare
  v_id bigint;
begin
  assert not has_function_privilege('anon', 'public.admin_pin_reserve_attempt(text)', 'execute'),
    'anon must not reserve attempts';
  assert not has_function_privilege('authenticated', 'public.admin_pin_mark_success(bigint)', 'execute'),
    'authenticated must not mark attempts';
  assert has_function_privilege('service_role', 'public.admin_pin_reserve_attempt(text)', 'execute'),
    'service_role must reserve attempts';

  for i in 1..8 loop
    assert public.admin_pin_reserve_attempt('10.0.0.1') is not null, format('attempt %s must be allowed', i);
  end loop;
  assert public.admin_pin_reserve_attempt('10.0.0.1') is null, '9th failure from one IP must be refused';
  assert public.admin_pin_reserve_attempt('10.0.0.2') is not null, 'another IP is not affected';

  v_id := public.admin_pin_reserve_attempt('10.0.0.3');
  perform public.admin_pin_mark_success(v_id);
  assert (select success from public.admin_pin_attempts where id = v_id), 'success is recorded';

  assert public.admin_pin_reserve_attempt(null) is not null, 'missing IP falls back to unknown';
  assert exists (select 1 from public.admin_pin_attempts where ip = 'unknown'), 'unknown bucket used';

  delete from public.admin_pin_attempts;
  for i in 1..50 loop
    perform public.admin_pin_reserve_attempt('172.16.0.' || i);
  end loop;
  assert public.admin_pin_reserve_attempt('192.168.1.1') is null, 'global cap of 50 failures per hour';

  update public.admin_pin_attempts set created_at = now() - interval '61 minutes';
  assert public.admin_pin_reserve_attempt('192.168.1.1') is not null, 'cap resets after an hour';
end $$;
