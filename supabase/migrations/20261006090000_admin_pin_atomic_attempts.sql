-- Every attempt is reserved as a failure before the PIN is checked, under one
-- advisory lock, so parallel requests serialize and see each other's attempts.
create index if not exists admin_pin_attempts_failed_created_at_idx
  on public.admin_pin_attempts (created_at)
  where not success;

create or replace function public.admin_pin_reserve_attempt(p_ip text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := coalesce(nullif(p_ip, ''), 'unknown');
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('admin_pin_attempts'));

  if (
    select count(*) from public.admin_pin_attempts
    where ip = v_ip and not success and created_at > now() - interval '10 minutes'
  ) >= 8 or (
    select count(*) from public.admin_pin_attempts
    where not success and created_at > now() - interval '60 minutes'
  ) >= 50 then
    return null;
  end if;

  insert into public.admin_pin_attempts (ip, success)
  values (v_ip, false)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_pin_mark_success(p_attempt_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.admin_pin_attempts set success = true where id = p_attempt_id;
$$;

revoke execute on function public.admin_pin_reserve_attempt(text) from public, anon, authenticated;
revoke execute on function public.admin_pin_mark_success(bigint) from public, anon, authenticated;
grant execute on function public.admin_pin_reserve_attempt(text) to service_role;
grant execute on function public.admin_pin_mark_success(bigint) to service_role;
