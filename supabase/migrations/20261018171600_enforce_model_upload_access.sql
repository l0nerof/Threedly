alter policy "Creators can insert published models"
  on public.models
  with check (
    creator_id = (select auth.uid())
    and status = 'published'::public.model_status
    and published_at is not null
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and can_upload
    )
  );

alter policy "Creators can insert their own model file rows"
  on public.model_files
  with check (
    exists (
      select 1 from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
    )
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and can_upload
    )
  );

alter policy "Creators can upload their own model files"
  on storage.objects
  with check (
    bucket_id = 'models'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and can_upload
    )
  );

alter policy "Creators can upload their own model images"
  on storage.objects
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and can_upload
    )
  );
