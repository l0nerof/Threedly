alter table public.profiles
  alter column downloads_limit_monthly set default 5;

update public.profiles
set downloads_limit_monthly = 5
where plan_key = 'free'::public.plan_key
  and downloads_limit_monthly = 0;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_username text;
  fallback_username text;
begin
  normalized_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  normalized_username := regexp_replace(normalized_username, '[^a-z0-9_]', '_', 'g');
  fallback_username := 'user_' || left(replace(new.id::text, '-', ''), 8);

  if normalized_username = '' then
    normalized_username := fallback_username;
  end if;

  if char_length(normalized_username) < 3 or char_length(normalized_username) > 20 then
    normalized_username := fallback_username;
  end if;

  if exists (
    select 1 from public.profiles where username = normalized_username
  ) then
    normalized_username := fallback_username;
  end if;

  insert into public.profiles (
    id, username, avatar_path, bio, plan_key,
    downloads_used_this_month, downloads_limit_monthly, can_upload
  )
  values (new.id, normalized_username, null, null, 'free', 0, 5, false)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.downloads
  drop constraint downloads_model_id_fkey,
  alter column model_id drop not null,
  add constraint downloads_model_id_fkey
    foreign key (model_id) references public.models (id) on delete set null;

revoke all privileges on table public.downloads from public, anon, authenticated;
grant select on table public.downloads to authenticated;

drop policy "Downloads are insertable by the owner" on public.downloads;
drop policy "Downloads are deletable by the owner" on public.downloads;

create type public.model_download_status as enum (
  'ok', 'unauthorized', 'model_unavailable', 'file_unavailable',
  'plan_required', 'quota_exceeded'
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create function private.record_model_download(requested_model_id uuid, requested_file_id uuid)
returns public.model_download_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles%rowtype;
  requested_model public.models%rowtype;
  requested_file public.model_files%rowtype;
  file_path_parts text[];
  month_start timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  month_end timestamptz := (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC';
  used_downloads bigint;
begin
  if current_user_id is null then
    return 'unauthorized';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    return 'unauthorized';
  end if;

  select * into requested_model
  from public.models
  where id = requested_model_id and status = 'published'::public.model_status
  for no key update;

  if not found then
    return 'model_unavailable';
  end if;

  if current_profile.plan_key < requested_model.minimum_plan then
    return 'plan_required';
  end if;

  select * into requested_file
  from public.model_files
  where id = requested_file_id and model_id = requested_model_id
  for share;

  if not found or requested_file.storage_provider <> 'supabase'::public.storage_provider
    or requested_file.bucket <> 'models' or requested_model.creator_id is null then
    return 'file_unavailable';
  end if;

  file_path_parts := string_to_array(requested_file.object_path, '/');
  if cardinality(file_path_parts) <> 3
    or file_path_parts[1] <> requested_model.creator_id::text
    or file_path_parts[2] <> requested_model_id::text
    or file_path_parts[3] in ('', '.', '..') then
    return 'file_unavailable';
  end if;

  perform 1 from storage.objects
  where bucket_id = requested_file.bucket and name = requested_file.object_path
  for share;

  if not found then
    return 'file_unavailable';
  end if;

  if exists (
    select 1 from public.downloads
    where user_id = current_user_id and model_id = requested_model_id
      and created_at >= month_start and created_at < month_end
  ) then
    return 'ok';
  end if;

  select count(distinct model_id) + count(*) filter (where model_id is null)
  into used_downloads
  from public.downloads
  where user_id = current_user_id
    and created_at >= month_start and created_at < month_end;

  if used_downloads >= current_profile.downloads_limit_monthly then
    return 'quota_exceeded';
  end if;

  insert into public.downloads (user_id, model_id)
  values (current_user_id, requested_model_id);

  update public.profiles
  set downloads_used_this_month = used_downloads + 1
  where id = current_user_id;

  update public.models
  set download_count = download_count + 1
  where id = requested_model_id;

  return 'ok';
end;
$$;

revoke execute on function private.record_model_download(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.record_model_download(uuid, uuid) to authenticated;

create function public.record_model_download(requested_model_id uuid, requested_file_id uuid)
returns public.model_download_status
language sql
security invoker
set search_path = ''
as $$
  select private.record_model_download(requested_model_id, requested_file_id);
$$;

revoke execute on function public.record_model_download(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.record_model_download(uuid, uuid) to authenticated;
