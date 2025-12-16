-- Allow public access to all files in the 'board-assets' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'board-assets' );

-- Allow authenticated users to upload files to 'board-assets'
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'board-assets'
  and auth.role() = 'authenticated'
);
