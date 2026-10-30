-- private bucket for exported part files
-- webhook uploads with admin client
-- members can only read
insert into storage.buckets (id, name, public, file_size_limit)
values ('part-files', 'part-files', false, 20 * 1024 * 1024);

create policy "Members can read part files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'part-files'
  and (select private.is_member())
);