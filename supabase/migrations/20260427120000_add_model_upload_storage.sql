insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'marketplace-files',
  'marketplace-files',
  false,
  52428800,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.models enable row level security;
alter table public.model_files enable row level security;

drop policy if exists "Published models are publicly readable" on public.models;
create policy "Published models are publicly readable"
  on public.models
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Creators can read their own models" on public.models;
create policy "Creators can read their own models"
  on public.models
  for select
  to authenticated
  using (creator_id = (select auth.uid()));

drop policy if exists "Creators can insert draft models" on public.models;
create policy "Creators can insert draft models"
  on public.models
  for insert
  to authenticated
  with check (
    creator_id = (select auth.uid())
    and status = 'draft'
  );

drop policy if exists "Creators can delete own draft models" on public.models;
create policy "Creators can delete own draft models"
  on public.models
  for delete
  to authenticated
  using (
    creator_id = (select auth.uid())
    and status = 'draft'
  );

drop policy if exists "Creators can read their own model file rows" on public.model_files;
create policy "Creators can read their own model file rows"
  on public.model_files
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can insert their own model file rows" on public.model_files;
create policy "Creators can insert their own model file rows"
  on public.model_files
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can delete their own model file rows" on public.model_files;
create policy "Creators can delete their own model file rows"
  on public.model_files
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can read their own stored model files" on storage.objects;
create policy "Creators can read their own stored model files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'marketplace-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Creators can upload their own model files" on storage.objects;
create policy "Creators can upload their own model files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'marketplace-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Creators can delete their own stored model files" on storage.objects;
create policy "Creators can delete their own stored model files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'marketplace-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
