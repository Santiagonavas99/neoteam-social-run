insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-media', 'admin-media', true, 4194304, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read admin media" on storage.objects;
create policy "Public can read admin media"
on storage.objects for select
to public
using (bucket_id = 'admin-media');
