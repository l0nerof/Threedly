alter table public.models
  add column deletion_pending boolean not null default false,
  add constraint models_pending_deletion_archived_check
    check (not deletion_pending or status = 'archived'::public.model_status);

revoke update, truncate, references, trigger on public.models, public.model_files
  from public, anon, authenticated;

alter policy "Creators can insert published models" on public.models
  with check (
    creator_id = (select auth.uid())
    and status = 'published'::public.model_status
    and published_at is not null
    and not deletion_pending
    and download_count = 0
    and not is_featured
    and exists (select 1 from public.profiles where id = (select auth.uid()) and can_upload)
  );

alter policy "Creators can insert their own model file rows" on public.model_files
  with check (
    exists (
      select 1 from public.models
      where models.id = model_files.model_id
        and models.creator_id = (select auth.uid())
        and not models.deletion_pending
    )
    and exists (select 1 from public.profiles where id = (select auth.uid()) and can_upload)
  );

alter policy "Creators can upload their own model files" on storage.objects
  with check (
    bucket_id = 'models'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (select 1 from public.profiles where id = (select auth.uid()) and can_upload)
    and not exists (
      select 1 from public.models
      where models.id::text = (storage.foldername(name))[2]
        and models.creator_id = (select auth.uid())
        and models.deletion_pending
    )
  );

alter policy "Creators can upload their own model images" on storage.objects
  with check (
    bucket_id = 'model-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (select 1 from public.profiles where id = (select auth.uid()) and can_upload)
    and not exists (
      select 1 from public.models
      where models.id::text = (storage.foldername(name))[2]
        and models.creator_id = (select auth.uid())
        and models.deletion_pending
    )
  );

create function private.manage_owned_model(
  requested_model_id uuid,
  requested_operation text,
  requested_metadata jsonb default null
)
returns table (result text, model_id uuid, model_paths jsonb, image_paths jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  upload_allowed boolean;
  owned_model public.models%rowtype;
  object_prefix text;
  path_pattern text;
begin
  model_id := requested_model_id;
  model_paths := '[]'::jsonb;
  image_paths := '[]'::jsonb;

  if current_user_id is null then
    result := 'unauthorized'; return next; return;
  end if;
  if requested_model_id is null or requested_operation is null
    or requested_operation not in ('update', 'archive', 'publish', 'begin_delete', 'finish_delete')
    or (requested_operation <> 'update' and requested_metadata is not null) then
    result := 'invalid_request'; return next; return;
  end if;

  select p.can_upload into upload_allowed
  from public.profiles p where p.id = current_user_id for share;
  if not found then
    result := 'unauthorized'; return next; return;
  end if;

  select m.* into owned_model from public.models m
  where m.id = requested_model_id and m.creator_id = current_user_id
  for update;
  if not found then
    result := 'model_unavailable'; return next; return;
  end if;

  object_prefix := current_user_id::text || '/' || requested_model_id::text || '/';
  path_pattern := '^' || object_prefix || '[a-z0-9][a-z0-9._-]*$';

  if requested_operation = 'begin_delete' then
    if not owned_model.deletion_pending then
      update public.models m set status = 'archived', deletion_pending = true
      where m.id = requested_model_id;
    end if;

    if owned_model.cover_image_path !~ path_pattern
      or (owned_model.preview_model_path is not null and owned_model.preview_model_path !~ path_pattern)
      or exists (
        select 1 from public.model_files f where f.model_id = requested_model_id
          and (f.storage_provider <> 'supabase'::public.storage_provider
            or f.bucket <> 'models' or f.object_path !~ path_pattern)
      ) then
      result := 'storage_unavailable'; return next; return;
    end if;

    select coalesce(jsonb_agg(o.name order by o.name), '[]'::jsonb) into model_paths
    from (
      select s.name from storage.objects s
      where s.bucket_id = 'models' and s.name like object_prefix || '%'
      order by s.name limit 100
    ) o;
    select coalesce(jsonb_agg(o.name order by o.name), '[]'::jsonb) into image_paths
    from (
      select s.name from storage.objects s
      where s.bucket_id = 'model-images' and s.name like object_prefix || '%'
      order by s.name limit 100
    ) o;
    result := 'ok'; return next; return;
  end if;

  if requested_operation = 'finish_delete' then
    if not owned_model.deletion_pending then
      result := 'invalid_request'; return next; return;
    end if;
    if owned_model.cover_image_path !~ path_pattern
      or (owned_model.preview_model_path is not null and owned_model.preview_model_path !~ path_pattern)
      or exists (
        select 1 from public.model_files f where f.model_id = requested_model_id
          and (f.storage_provider <> 'supabase'::public.storage_provider
            or f.bucket <> 'models' or f.object_path !~ path_pattern)
      ) then
      result := 'storage_unavailable'; return next; return;
    end if;
    if exists (
      select 1 from storage.objects s
      where s.bucket_id in ('models', 'model-images') and s.name like object_prefix || '%'
    ) then
      result := 'cleanup_incomplete'; return next; return;
    end if;
    delete from public.models m where m.id = requested_model_id;
    result := 'ok'; return next; return;
  end if;

  if owned_model.deletion_pending then
    result := 'deletion_pending'; return next; return;
  end if;

  if requested_operation = 'update' then
    if requested_metadata is null or jsonb_typeof(requested_metadata) <> 'object' then
      result := 'invalid_request'; return next; return;
    end if;
    if not (requested_metadata ?& array['titleUa', 'titleEn', 'descriptionUa', 'descriptionEn', 'categoryId', 'minimumPlan'])
      or requested_metadata - array['titleUa', 'titleEn', 'descriptionUa', 'descriptionEn', 'categoryId', 'minimumPlan'] <> '{}'::jsonb
      or jsonb_typeof(requested_metadata->'titleUa') <> 'string'
      or jsonb_typeof(requested_metadata->'titleEn') <> 'string'
      or jsonb_typeof(requested_metadata->'categoryId') <> 'string'
      or jsonb_typeof(requested_metadata->'minimumPlan') <> 'string'
      or jsonb_typeof(requested_metadata->'descriptionUa') not in ('string', 'null')
      or jsonb_typeof(requested_metadata->'descriptionEn') not in ('string', 'null')
      or char_length(btrim(requested_metadata->>'titleUa')) not between 2 and 90
      or char_length(btrim(requested_metadata->>'titleEn')) not between 2 and 90
      or char_length(coalesce(btrim(requested_metadata->>'descriptionUa'), '')) > 600
      or char_length(coalesce(btrim(requested_metadata->>'descriptionEn'), '')) > 600
      or requested_metadata->>'minimumPlan' not in ('free', 'pro', 'max')
      or not exists (
        select 1 from public.categories c
        where c.id::text = lower(requested_metadata->>'categoryId')
      ) then
      result := 'invalid_request'; return next; return;
    end if;
    update public.models m set
      title_ua = btrim(requested_metadata->>'titleUa'),
      title_en = btrim(requested_metadata->>'titleEn'),
      description_ua = nullif(btrim(requested_metadata->>'descriptionUa'), ''),
      description_en = nullif(btrim(requested_metadata->>'descriptionEn'), ''),
      category_id = (requested_metadata->>'categoryId')::uuid,
      minimum_plan = (requested_metadata->>'minimumPlan')::public.plan_key
    where m.id = requested_model_id;
  elsif requested_operation = 'archive' then
    if owned_model.status <> 'archived'::public.model_status then
      update public.models m set status = 'archived' where m.id = requested_model_id;
    end if;
  elsif requested_operation = 'publish' then
    if not upload_allowed then
      result := 'upload_not_allowed'; return next; return;
    end if;
    if not exists (
      select 1 from public.model_files f join storage.objects s
        on s.bucket_id = f.bucket and s.name = f.object_path
      where f.model_id = requested_model_id and f.storage_provider = 'supabase'::public.storage_provider
        and f.bucket = 'models' and f.object_path ~ path_pattern
    ) or not exists (
      select 1 from storage.objects s where s.bucket_id = 'model-images'
        and s.name = owned_model.cover_image_path and s.name ~ path_pattern
    ) then
      result := 'file_unavailable'; return next; return;
    end if;
    if owned_model.status <> 'published'::public.model_status then
      update public.models m
      set status = 'published', published_at = coalesce(m.published_at, now())
      where m.id = requested_model_id;
    end if;
  end if;
  result := 'ok'; return next;
end;
$$;

revoke all on function private.manage_owned_model(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function private.manage_owned_model(uuid, text, jsonb) to authenticated;

create function public.manage_owned_model(
  requested_model_id uuid,
  requested_operation text,
  requested_metadata jsonb default null
)
returns table (result text, model_id uuid, model_paths jsonb, image_paths jsonb)
language sql
security invoker
set search_path = ''
as $$
  select * from private.manage_owned_model(requested_model_id, requested_operation, requested_metadata);
$$;

revoke all on function public.manage_owned_model(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.manage_owned_model(uuid, text, jsonb) to authenticated;
