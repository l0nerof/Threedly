create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_path text,
  bio text,
  plan_key text not null default 'free',
  downloads_used_this_month integer not null default 0,
  downloads_limit_monthly integer not null default 0,
  can_upload boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_format_check
    check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_plan_key_check
    check (plan_key in ('free', 'pro', 'max')),
  constraint profiles_downloads_used_non_negative_check
    check (downloads_used_this_month >= 0),
  constraint profiles_downloads_limit_non_negative_check
    check (downloads_limit_monthly >= 0),
  constraint profiles_downloads_usage_bounds_check
    check (downloads_used_this_month <= downloads_limit_monthly)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ua text not null,
  name_en text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  creator_id uuid references public.profiles (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  title_ua text not null,
  title_en text not null,
  description_ua text,
  description_en text,
  cover_image_path text not null,
  preview_model_path text,
  status text not null default 'draft',
  minimum_plan text not null default 'free',
  file_format text,
  file_size_bytes bigint,
  polygon_count integer,
  download_count integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint models_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint models_minimum_plan_check
    check (minimum_plan in ('free', 'pro', 'max')),
  constraint models_file_size_non_negative_check
    check (file_size_bytes is null or file_size_bytes >= 0),
  constraint models_polygon_count_non_negative_check
    check (polygon_count is null or polygon_count >= 0),
  constraint models_download_count_non_negative_check
    check (download_count >= 0)
);

create table public.model_files (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models (id) on delete cascade,
  storage_provider text not null,
  bucket text not null,
  object_path text not null,
  file_name text not null,
  format text not null,
  file_size_bytes bigint not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint model_files_storage_provider_check
    check (storage_provider in ('supabase', 'r2')),
  constraint model_files_file_size_non_negative_check
    check (file_size_bytes >= 0)
);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  model_id uuid not null references public.models (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, model_id)
);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  model_id uuid not null references public.models (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index models_category_status_idx
  on public.models (category_id, status);

create index models_creator_idx
  on public.models (creator_id);

create index models_featured_idx
  on public.models (is_featured)
  where is_featured = true;

create index model_files_model_idx
  on public.model_files (model_id);

create unique index model_files_primary_unique_idx
  on public.model_files (model_id)
  where is_primary = true;

create index favorites_model_idx
  on public.favorites (model_id);

create index downloads_user_created_at_idx
  on public.downloads (user_id, created_at desc);

create index downloads_model_idx
  on public.downloads (model_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists models_set_updated_at on public.models;
create trigger models_set_updated_at
before update on public.models
for each row
execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.downloads enable row level security;

create policy "Profiles are readable by the owner"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are insertable by the owner"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Profiles are updatable by the owner"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Favorites are readable by the owner"
  on public.favorites
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Favorites are insertable by the owner"
  on public.favorites
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Favorites are deletable by the owner"
  on public.favorites
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Downloads are readable by the owner"
  on public.downloads
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Downloads are insertable by the owner"
  on public.downloads
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Downloads are deletable by the owner"
  on public.downloads
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.is_username_available(u text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when u is null then false
      when trim(u) = '' then false
      else not exists (
        select 1
        from public.profiles
        where username = lower(trim(u))
      )
    end;
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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
    select 1
    from public.profiles
    where username = normalized_username
  ) then
    normalized_username := fallback_username;
  end if;

  insert into public.profiles (
    id,
    username,
    avatar_path,
    bio,
    plan_key,
    downloads_used_this_month,
    downloads_limit_monthly,
    can_upload
  )
  values (
    new.id,
    normalized_username,
    null,
    null,
    'free',
    0,
    0,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatar images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
