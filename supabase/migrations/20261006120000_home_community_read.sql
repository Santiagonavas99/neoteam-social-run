-- The home reads running groups and brands with the publishable key. RLS policies existed,
-- but anon had no SELECT privilege, so every read failed with "permission denied".
-- Column-level grants: anon sees only what the home renders, plus the columns its
-- filters, ordering and policies reference.
revoke all on table public.running_groups from anon, authenticated;
revoke all on table public.brands from anon, authenticated;

grant select (id, name, slug, logo_url, instagram, active, show_on_home, sort_order)
  on table public.running_groups to anon, authenticated;
grant select (id, name, logo_url, type, instagram, website, active, show_on_home, sort_order)
  on table public.brands to anon, authenticated;

-- Permissive policies are OR'ed: these looser duplicates let the 'independiente'
-- placeholder group through the stricter "Public can view home running groups".
drop policy if exists public_read_active_running_groups on public.running_groups;
drop policy if exists public_read_active_brands on public.brands;
