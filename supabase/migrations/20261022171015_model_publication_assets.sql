create type public.publication_draft_state as enum ('draft', 'publishing', 'published', 'cancelling', 'deleting');
create type public.publication_asset_kind as enum ('source', 'cover');
create type public.publication_asset_state as enum ('reserved', 'active', 'retired', 'deleting');

alter table public.model_publication_drafts
  add column revision integer not null default 0 check (revision >= 0),
  add column lifecycle public.publication_draft_state not null default 'draft',
  add column publication_model_id uuid unique,
  add column source_asset_id uuid,
  add column cover_asset_id uuid;

create table public.model_publication_assets (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.model_publication_drafts(id) on delete cascade,
  kind public.publication_asset_kind not null,
  object_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255 and file_name !~ '[/\\[:cntrl:]]'),
  extension text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  state public.publication_asset_state not null default 'reserved',
  upload_expires_at timestamptz not null default now() + interval '15 minutes',
  created_at timestamptz not null default now(),
  constraint publication_asset_type_check check (
    (kind = 'source' and extension in ('glb','gltf','fbx','obj','max','blend','zip') and mime_type = 'application/octet-stream')
    or (kind = 'cover' and byte_size <= 5242880 and
      ((extension = 'jpg' and mime_type = 'image/jpeg') or
       (extension = 'png' and mime_type = 'image/png') or
       (extension = 'webp' and mime_type = 'image/webp')))
  )
);
create index model_publication_assets_draft_idx on public.model_publication_assets(draft_id, state, id);
create unique index model_publication_assets_active_kind_idx
  on public.model_publication_assets(draft_id, kind) where state = 'active';
alter table public.model_publication_drafts
  add constraint publication_source_asset_fkey foreign key (source_asset_id)
    references public.model_publication_assets(id) on delete set null,
  add constraint publication_cover_asset_fkey foreign key (cover_asset_id)
    references public.model_publication_assets(id) on delete set null;
create index model_publication_drafts_source_idx on public.model_publication_drafts(source_asset_id);
create index model_publication_drafts_cover_idx on public.model_publication_drafts(cover_asset_id);

grant usage on schema private to service_role;
create table private.model_publication_destinations (
  model_id uuid primary key,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid references public.model_publication_drafts(id) on delete set null,
  source_path text not null,
  cover_path text not null,
  state text not null check (state in ('publishing','closed','published'))
);
create index model_publication_destinations_creator_idx on private.model_publication_destinations(creator_id);
create index model_publication_destinations_draft_idx on private.model_publication_destinations(draft_id);
alter table private.model_publication_destinations enable row level security;
revoke all on private.model_publication_destinations from public,anon,authenticated;
grant all on private.model_publication_destinations to service_role;

alter table public.model_publication_assets enable row level security;
revoke all on public.model_publication_assets from public, anon, authenticated;
grant select on public.model_publication_assets to authenticated;
grant all on public.model_publication_assets to service_role;
create policy "Creators can read their publication asset records"
  on public.model_publication_assets for select to authenticated
  using (exists (select 1 from public.model_publication_drafts d
    where d.id = draft_id and d.creator_id = (select auth.uid())));
alter policy "Creators can edit their own publication drafts" on public.model_publication_drafts
  using (creator_id = (select auth.uid()) and lifecycle = 'draft')
  with check (creator_id = (select auth.uid()) and lifecycle = 'draft');

create or replace function private.touch_model_publication_draft()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  new.revision := old.revision + 1;
  return new;
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('model-draft-files', 'model-draft-files', false, 52428800, array['application/octet-stream']),
  ('model-draft-images', 'model-draft-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function private.publication_file_name(file_name text, extension text)
returns text language sql immutable security invoker set search_path = ''
as $$
  select coalesce(nullif(left(trim(both '-' from regexp_replace(
    lower(regexp_replace(normalize(case
      when length(btrim(file_name)) > length(extension) + 1
        then left(btrim(file_name), length(btrim(file_name)) - length(extension) - 1)
      else btrim(file_name) end, NFKD),
      '[̀-ͯ]', '', 'g')), '[^a-z0-9]+', '-', 'g')), 80), ''), 'model') || '.' || extension;
$$;
create function private.publication_destination_path(
  asset public.model_publication_assets, model_id uuid, creator_id uuid
) returns text language sql immutable security invoker set search_path = ''
as $$
  select creator_id::text || '/' || model_id::text || '/' ||
    case when asset.kind = 'cover' then 'cover.' || asset.extension
      else private.publication_file_name(asset.file_name, asset.extension) end;
$$;
revoke all on function private.publication_file_name(text,text),
  private.publication_destination_path(public.model_publication_assets,uuid,uuid) from public, anon, authenticated;
grant execute on function private.publication_file_name(text,text),
  private.publication_destination_path(public.model_publication_assets,uuid,uuid) to authenticated;

create policy "Creators can read their private draft files"
  on storage.objects for select to authenticated using (
    bucket_id in ('model-draft-files','model-draft-images') and exists (
      select 1 from public.model_publication_assets a
      join public.model_publication_drafts d on d.id = a.draft_id
      where a.object_path = name and d.creator_id = (select auth.uid())
        and bucket_id = case when a.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end
    )
  );
create function private.publication_object_allowed(
  requested_actor uuid, requested_bucket text, requested_path text, requested_operation text
) returns boolean language plpgsql volatile security invoker set search_path = ''
as $$
declare
  uid uuid := requested_actor;
  permitted boolean;
  draft_uuid uuid;
  d public.model_publication_drafts%rowtype;
  a public.model_publication_assets%rowtype;
  destination private.model_publication_destinations%rowtype;
begin
  if uid is null or requested_operation is null or requested_operation not in ('insert','delete') then return false; end if;
  select p.can_upload into permitted from public.profiles p where p.id = uid for share;
  if not found then return false; end if;
  if requested_bucket in ('model-draft-files','model-draft-images') then
    select v.draft_id into draft_uuid from public.model_publication_assets v where v.object_path = requested_path;
    if not found then return false; end if;
    select v.* into d from public.model_publication_drafts v
      where v.id = draft_uuid and v.creator_id = uid for share;
    if not found then return false; end if;
    select v.* into a from public.model_publication_assets v
      where v.draft_id = d.id and v.object_path = requested_path for share;
    if not found or requested_bucket <> (case when a.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end) then
      return false;
    end if;
    if requested_operation = 'delete' then return a.state = 'deleting'; end if;
    return d.lifecycle = 'draft' and a.state = 'reserved' and a.upload_expires_at > now() and permitted;
  elsif requested_bucket in ('models','model-images') then
    select v.* into destination from private.model_publication_destinations v
      where v.model_id::text = (storage.foldername(requested_path))[2] for share;
    if not found then return true; end if;
    if destination.creator_id <> uid then return false; end if;
    if requested_operation = 'insert' then
      return permitted and destination.state = 'publishing' and requested_path =
        case when requested_bucket = 'models' then destination.source_path else destination.cover_path end;
    end if;
    return destination.state = 'closed' or (destination.state = 'published' and not exists(
      select 1 from public.models m where m.id = destination.model_id and not m.deletion_pending));
  end if;
  return true;
end;
$$;
revoke all on function private.publication_object_allowed(uuid,text,text,text) from public,anon,authenticated,service_role;
create or replace function private.publication_storage_permission(
  requested_bucket text, requested_path text, requested_operation text
) returns boolean language sql volatile security definer set search_path = ''
as $$
  select auth.uid() is not null and private.publication_object_allowed(auth.uid(),requested_bucket,requested_path,requested_operation);
$$;
revoke all on function private.publication_storage_permission(text,text,text) from public,anon,authenticated;
grant execute on function private.publication_storage_permission(text,text,text) to authenticated;

create function private.guard_publication_storage_insert()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if new.bucket_id not in ('model-draft-files','model-draft-images') and not (
    new.bucket_id in ('models','model-images') and exists(
      select 1 from private.model_publication_destinations v
      where v.model_id::text = (storage.foldername(new.name))[2])) then
    return new;
  end if;
  if uid is null and current_setting('role',true) not in ('anon','authenticated') then
    select p.id into uid from public.profiles p where p.id::text = coalesce(new.owner_id,new.owner::text);
  end if;
  if not private.publication_object_allowed(uid,new.bucket_id,new.name,'insert') then
    raise exception 'Publication file destination is closed or invalid' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_publication_storage_insert() from public,anon,authenticated,service_role;
create trigger guard_publication_storage_insert before insert on storage.objects
  for each row execute function private.guard_publication_storage_insert();
create policy "Creators can upload reserved draft files"
  on storage.objects for insert to authenticated with check (
    bucket_id in ('model-draft-files','model-draft-images')
    and private.publication_storage_permission(bucket_id,name,'insert'));
create policy "Creators can remove released draft files"
  on storage.objects for delete to authenticated using (
    bucket_id in ('model-draft-files','model-draft-images')
    and private.publication_storage_permission(bucket_id,name,'delete'));
create policy "Publication candidates accept only frozen destinations"
  on storage.objects as restrictive for insert to authenticated with check (
    bucket_id not in ('models','model-images') or private.publication_storage_permission(bucket_id,name,'insert'));
create policy "Publication candidates cannot disappear during publication"
  on storage.objects as restrictive for delete to authenticated using (
    bucket_id not in ('models','model-images') or private.publication_storage_permission(bucket_id,name,'delete'));

create function private.publication_asset_json(a public.model_publication_assets, model_id uuid, creator_id uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'id', a.id, 'draftId', a.draft_id, 'kind', a.kind,
    'bucket', case when a.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end,
    'path', a.object_path, 'name', a.file_name, 'extension', a.extension,
    'mimeType', a.mime_type, 'size', a.byte_size, 'state', a.state,
    'destinationBucket', case when model_id is null then null when a.kind = 'cover' then 'model-images' else 'models' end,
    'destinationPath', case when model_id is null then null else private.publication_destination_path(a,model_id,creator_id) end
  );
$$;
revoke all on function private.publication_asset_json(public.model_publication_assets,uuid,uuid)
  from public, anon, authenticated;

create function private.manage_publication_draft(
  requested_draft_id uuid, requested_operation text,
  requested_revision integer default null, requested_payload jsonb default null
) returns table(result text, draft_id uuid, revision integer,
  lifecycle public.publication_draft_state, model_id uuid, assets jsonb, objects jsonb)
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  permitted boolean;
  d public.model_publication_drafts%rowtype;
  a public.model_publication_assets%rowtype;
  prefix text;
  original_name text;
  ext text;
  mime text;
  size_text text;
  asset_kind text;
begin
  draft_id := requested_draft_id; assets := '[]'; objects := '[]';
  if uid is null then result := 'unauthorized'; return next; return; end if;
  if requested_draft_id is null or requested_operation is null or requested_operation not in
    ('create','save','reserve','attach','release','prepare_publish','finish_publish',
     'cancel_publish','begin_delete','cleanup','finish_cleanup') then
    result := 'invalid_request'; return next; return;
  end if;
  select p.can_upload into permitted from public.profiles p where p.id = uid for share;
  if not found then result := 'unauthorized'; return next; return; end if;
  if requested_operation = 'create' then
    if requested_payload is not null or requested_revision is not null then
      result := 'invalid_request'; return next; return;
    end if;
    if not permitted then result := 'upload_not_allowed'; return next; return; end if;
    insert into public.model_publication_drafts(id,creator_id) values(requested_draft_id,uid)
      on conflict(id) do nothing;
  end if;
  select v.* into d from public.model_publication_drafts v
    where v.id = requested_draft_id and v.creator_id = uid for update;
  if not found then result := 'draft_unavailable'; return next; return; end if;
  revision := d.revision; lifecycle := d.lifecycle; model_id := d.publication_model_id;
  prefix := uid::text || '/' || d.id::text || '/';
  if requested_operation in ('save','reserve','attach','release','prepare_publish','cancel_publish','begin_delete')
    and (requested_revision is null or requested_revision <> d.revision)
    and not (requested_operation = 'prepare_publish' and d.lifecycle in ('publishing','published'))
    and not (requested_operation = 'begin_delete' and d.lifecycle = 'deleting')
    and not (requested_operation = 'cancel_publish' and d.lifecycle = 'cancelling') then
    result := 'conflict'; return next; return;
  end if;
  if requested_operation not in ('save','reserve','attach','release') and requested_payload is not null then
    result := 'invalid_request'; return next; return;
  end if;
  if requested_operation in ('save','reserve','attach','release') and d.lifecycle <> 'draft' then
    result := 'busy'; return next; return;
  end if;

  if requested_operation = 'save' then
    if requested_payload is null or jsonb_typeof(requested_payload) <> 'object'
      or not (requested_payload ?& array['titleUa','titleEn','descriptionUa','descriptionEn','categoryId','minimumPlan'])
      or requested_payload - array['titleUa','titleEn','descriptionUa','descriptionEn','categoryId','minimumPlan'] <> '{}'
      or jsonb_typeof(requested_payload->'titleUa') <> 'string'
      or jsonb_typeof(requested_payload->'titleEn') <> 'string'
      or jsonb_typeof(requested_payload->'descriptionUa') not in ('string','null')
      or jsonb_typeof(requested_payload->'descriptionEn') not in ('string','null')
      or jsonb_typeof(requested_payload->'categoryId') not in ('string','null')
      or jsonb_typeof(requested_payload->'minimumPlan') <> 'string'
      or char_length(requested_payload->>'titleUa') > 90 or char_length(requested_payload->>'titleEn') > 90
      or char_length(coalesce(requested_payload->>'descriptionUa','')) > 600
      or char_length(coalesce(requested_payload->>'descriptionEn','')) > 600
      or requested_payload->>'minimumPlan' not in ('free','pro','max')
      or (requested_payload->>'categoryId' is not null and not exists (
        select 1 from public.categories c where c.id::text = lower(requested_payload->>'categoryId'))) then
      result := 'invalid_request'; return next; return;
    end if;
    update public.model_publication_drafts v set
      title_ua = requested_payload->>'titleUa', title_en = requested_payload->>'titleEn',
      description_ua = requested_payload->>'descriptionUa', description_en = requested_payload->>'descriptionEn',
      category_id = (requested_payload->>'categoryId')::uuid,
      minimum_plan = (requested_payload->>'minimumPlan')::public.plan_key where v.id = d.id;
  elsif requested_operation = 'reserve' then
    if not permitted then result := 'upload_not_allowed'; return next; return; end if;
    if requested_payload is null or jsonb_typeof(requested_payload) <> 'object'
      or not (requested_payload ?& array['kind','name','extension','mimeType','size'])
      or requested_payload - array['kind','name','extension','mimeType','size'] <> '{}'
      or jsonb_typeof(requested_payload->'kind') <> 'string'
      or jsonb_typeof(requested_payload->'name') <> 'string'
      or jsonb_typeof(requested_payload->'extension') <> 'string'
      or jsonb_typeof(requested_payload->'mimeType') <> 'string'
      or jsonb_typeof(requested_payload->'size') <> 'number' then
      result := 'invalid_request'; return next; return;
    end if;
    original_name := btrim(requested_payload->>'name'); ext := requested_payload->>'extension';
    mime := requested_payload->>'mimeType'; size_text := requested_payload->>'size';
    asset_kind := requested_payload->>'kind';
    if size_text !~ '^[0-9]{1,8}$' then
      result := 'invalid_request'; return next; return;
    end if;
    if char_length(original_name) not between 1 and 255 or original_name ~ '[/\\[:cntrl:]]'
      or size_text::bigint not between 1 and 52428800
      or not ((asset_kind = 'source' and ext in ('glb','gltf','fbx','obj','max','blend','zip')
        and lower(substring(original_name from '\.([^.]+)$')) = ext and mime = 'application/octet-stream')
        or (asset_kind = 'cover' and size_text::bigint <= 5242880 and
          ((ext='jpg' and mime='image/jpeg') or (ext='png' and mime='image/png') or (ext='webp' and mime='image/webp')))) then
      result := 'invalid_request'; return next; return;
    end if;
    if (select count(*) from public.model_publication_assets v where v.draft_id = d.id) >= 100 then
      result := 'cleanup_incomplete'; return next; return;
    end if;
    a.id := gen_random_uuid();
    insert into public.model_publication_assets(id,draft_id,kind,object_path,file_name,extension,mime_type,byte_size)
      values(a.id,d.id,asset_kind::public.publication_asset_kind,prefix || a.id::text || '.' || ext,
        original_name,ext,mime,size_text::bigint) returning * into a;
    assets := jsonb_build_array(private.publication_asset_json(a,null,uid));
  elsif requested_operation in ('attach','release') then
    if requested_payload is null or jsonb_typeof(requested_payload) <> 'object'
      or requested_payload - array['assetId'] <> '{}' or jsonb_typeof(requested_payload->'assetId') <> 'string'
      or not exists (select 1 from public.model_publication_assets v
        where v.draft_id = d.id and v.id::text = lower(requested_payload->>'assetId')) then
      result := 'invalid_request'; return next; return;
    end if;
    select v.* into a from public.model_publication_assets v
      where v.draft_id = d.id and v.id::text = lower(requested_payload->>'assetId') for update;
    if requested_operation = 'release' then
      if a.state = 'active' then result := 'invalid_request'; return next; return; end if;
      update public.model_publication_assets set state = 'deleting' where id = a.id;
    else
      if not permitted then result := 'upload_not_allowed'; return next; return; end if;
      if a.state <> 'reserved' or a.upload_expires_at <= now() then
        result := 'file_unavailable'; return next; return;
      end if;
      if not exists (select 1 from storage.objects s where s.name = a.object_path
        and s.bucket_id = case when a.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end
        and s.metadata->>'size' = a.byte_size::text and s.metadata->>'mimetype' = a.mime_type) then
        result := 'file_unavailable'; return next; return;
      end if;
      update public.model_publication_assets v set state = 'retired'
        where v.draft_id = d.id and v.kind = a.kind and v.state = 'active';
      update public.model_publication_assets set state = 'active', upload_expires_at = now() where id = a.id;
      update public.model_publication_drafts v set
        source_asset_id = case when a.kind = 'source' then a.id else v.source_asset_id end,
        cover_asset_id = case when a.kind = 'cover' then a.id else v.cover_asset_id end where v.id = d.id;
    end if;
  elsif requested_operation = 'prepare_publish' then
    if d.lifecycle = 'published' then result := 'ok'; return next; return; end if;
    if not permitted then result := 'upload_not_allowed'; return next; return; end if;
    if d.lifecycle not in ('draft','publishing') then result := 'busy'; return next; return; end if;
    if d.lifecycle = 'draft' then
      if char_length(btrim(d.title_ua)) < 2 or char_length(btrim(d.title_en)) < 2 or d.category_id is null
        or d.source_asset_id is null or d.cover_asset_id is null then
        result := 'not_ready'; return next; return;
      end if;
    end if;
    if (select count(*) from public.model_publication_assets v join storage.objects s on s.name = v.object_path
        and s.bucket_id = case when v.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end
        and s.metadata->>'size' = v.byte_size::text and s.metadata->>'mimetype' = v.mime_type
      where v.id in (d.source_asset_id,d.cover_asset_id) and v.draft_id = d.id and v.state = 'active') <> 2 then
      result := 'file_unavailable'; return next; return;
    end if;
    if d.lifecycle = 'draft' then
      update public.model_publication_drafts v set lifecycle = 'publishing',
        publication_model_id = gen_random_uuid()
        where v.id = d.id returning * into d;
      insert into private.model_publication_destinations(model_id,creator_id,draft_id,source_path,cover_path,state)
        select d.publication_model_id,uid,d.id,
          private.publication_destination_path(s,d.publication_model_id,uid),
          private.publication_destination_path(c,d.publication_model_id,uid),'publishing'
        from public.model_publication_assets s, public.model_publication_assets c
        where s.id = d.source_asset_id and c.id = d.cover_asset_id;
    end if;
    select jsonb_agg(private.publication_asset_json(v,d.publication_model_id,uid) order by v.kind)
      into assets from public.model_publication_assets v where v.id in (d.source_asset_id,d.cover_asset_id);
  elsif requested_operation = 'finish_publish' then
    if d.lifecycle = 'published' then result := 'ok'; return next; return; end if;
    if d.lifecycle <> 'publishing' then result := 'busy'; return next; return; end if;
    if not permitted then result := 'upload_not_allowed'; return next; return; end if;
    if char_length(btrim(d.title_ua)) < 2 or char_length(btrim(d.title_en)) < 2 or d.category_id is null then
      result := 'not_ready'; return next; return;
    end if;
    if (select count(*) from public.model_publication_assets v join storage.objects s
        on s.name = private.publication_destination_path(v,d.publication_model_id,uid)
        and s.bucket_id = case when v.kind = 'cover' then 'model-images' else 'models' end
        and s.metadata->>'size' = v.byte_size::text and s.metadata->>'mimetype' = v.mime_type
      where v.id in (d.source_asset_id,d.cover_asset_id) and v.draft_id = d.id and v.state = 'active') <> 2 then
      result := 'file_unavailable'; return next; return;
    end if;
    select v.* into a from public.model_publication_assets v where v.id = d.source_asset_id;
    insert into public.models(id,creator_id,category_id,slug,title_ua,title_en,description_ua,description_en,
      cover_image_path,status,minimum_plan,file_format,file_size_bytes,published_at)
    select d.publication_model_id,uid,d.category_id,
      left(split_part(private.publication_file_name(d.title_en || '.glb','glb'),'.',1),60) || '-' || left(d.publication_model_id::text,8),
      btrim(d.title_ua),btrim(d.title_en),nullif(btrim(d.description_ua),''),nullif(btrim(d.description_en),''),
      private.publication_destination_path(c,d.publication_model_id,uid),'published',d.minimum_plan,a.extension,a.byte_size,now()
      from public.model_publication_assets c where c.id = d.cover_asset_id;
    insert into public.model_files(model_id,storage_provider,bucket,object_path,file_name,format,file_size_bytes,is_primary)
      values(d.publication_model_id,'supabase','models',
        private.publication_destination_path(a,d.publication_model_id,uid),a.file_name,a.extension,a.byte_size,true);
    update public.model_publication_assets v set state = 'retired' where v.id in (d.source_asset_id,d.cover_asset_id);
    update public.model_publication_drafts v set lifecycle = 'published', source_asset_id = null, cover_asset_id = null
      where v.id = d.id;
    update private.model_publication_destinations v set state = 'published' where v.model_id = d.publication_model_id;
  elsif requested_operation in ('cancel_publish','begin_delete') then
    if d.lifecycle = 'published' then result := 'already_published'; return next; return; end if;
    update private.model_publication_destinations v set state = 'closed' where v.model_id = d.publication_model_id;
    if requested_operation = 'cancel_publish' then
      if d.lifecycle not in ('publishing','cancelling') then result := 'busy'; return next; return; end if;
      update public.model_publication_drafts v set lifecycle = 'cancelling' where v.id = d.id and v.lifecycle <> 'cancelling';
    else
      update public.model_publication_drafts v set lifecycle = 'deleting' where v.id = d.id and v.lifecycle <> 'deleting';
      update public.model_publication_assets v set state = 'deleting' where v.draft_id = d.id;
    end if;
  elsif requested_operation = 'cleanup' then
    update public.model_publication_assets v set state = 'deleting'
      where v.draft_id = d.id and (v.state = 'retired' or (v.state = 'reserved' and v.upload_expires_at <= now()));
    select coalesce(jsonb_agg(jsonb_build_object(
      'bucket', case when v.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end,
      'path', v.object_path) order by v.id),'[]') into objects
      from (select * from public.model_publication_assets x where x.draft_id = d.id and x.state = 'deleting'
        order by x.id limit 100) v;
    if d.lifecycle in ('cancelling','deleting') and d.publication_model_id is not null then
      objects := objects || coalesce((select jsonb_agg(jsonb_build_object(
        'bucket', case when v.kind = 'cover' then 'model-images' else 'models' end,
        'path', private.publication_destination_path(v,d.publication_model_id,uid)))
        from public.model_publication_assets v where v.id in (d.source_asset_id,d.cover_asset_id)),'[]'::jsonb);
    end if;
  elsif requested_operation = 'finish_cleanup' then
    if d.lifecycle in ('cancelling','deleting') and d.publication_model_id is not null then
      if exists(select 1 from storage.objects s
        where s.bucket_id in ('models','model-images') and s.name like uid::text || '/' || d.publication_model_id::text || '/%') then
        result := 'cleanup_incomplete'; return next; return;
      end if;
    end if;
    delete from public.model_publication_assets v where v.draft_id = d.id and v.state = 'deleting'
      and v.upload_expires_at <= now() and not exists (
        select 1 from storage.objects s where s.name = v.object_path
        and s.bucket_id = case when v.kind = 'cover' then 'model-draft-images' else 'model-draft-files' end);
    if exists(select 1 from public.model_publication_assets v where v.draft_id = d.id and v.state = 'deleting') then
      result := 'cleanup_incomplete'; return next; return;
    end if;
    if d.lifecycle = 'cancelling' then
      update public.model_publication_drafts v set lifecycle = 'draft',
        publication_model_id = null where v.id = d.id;
    elsif d.lifecycle = 'deleting' then
      if exists(select 1 from storage.objects s where s.bucket_id in ('model-draft-files','model-draft-images')
        and s.name like prefix || '%') then result := 'cleanup_incomplete'; return next; return; end if;
      delete from public.model_publication_drafts v where v.id = d.id;
      revision := null; lifecycle := null;
      result := 'ok'; return next; return;
    end if;
  end if;
  select v.* into d from public.model_publication_drafts v where v.id = requested_draft_id;
  revision := d.revision; lifecycle := d.lifecycle; model_id := d.publication_model_id;
  result := 'ok'; return next;
end;
$$;
revoke all on function private.manage_publication_draft(uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function private.manage_publication_draft(uuid,text,integer,jsonb) to authenticated;
create function public.manage_publication_draft(
  requested_draft_id uuid, requested_operation text,
  requested_revision integer default null, requested_payload jsonb default null
) returns table(result text, draft_id uuid, revision integer,
  lifecycle public.publication_draft_state, model_id uuid, assets jsonb, objects jsonb)
language sql security invoker set search_path = ''
as $$ select * from private.manage_publication_draft(requested_draft_id,requested_operation,requested_revision,requested_payload); $$;
revoke all on function public.manage_publication_draft(uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.manage_publication_draft(uuid,text,integer,jsonb) to authenticated;

create function private.guard_publication_draft_deletion()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  update private.model_publication_destinations v set state = 'closed'
    where v.draft_id = old.id and v.state = 'publishing';
  if exists (select 1 from storage.objects s where s.bucket_id in ('model-draft-files','model-draft-images')
    and s.name like old.creator_id::text || '/' || old.id::text || '/%')
    or (old.lifecycle <> 'published' and old.publication_model_id is not null and exists (
      select 1 from storage.objects s where s.bucket_id in ('models','model-images')
      and s.name like old.creator_id::text || '/' || old.publication_model_id::text || '/%')) then
    raise exception 'Publication draft file cleanup is incomplete' using errcode = '23503';
  end if;
  return old;
end;
$$;
revoke all on function private.guard_publication_draft_deletion() from public,anon,authenticated,service_role;
create trigger guard_publication_draft_deletion before delete on public.model_publication_drafts
  for each row execute function private.guard_publication_draft_deletion();
