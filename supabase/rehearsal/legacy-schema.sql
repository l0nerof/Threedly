-- Hosted Threedly metadata verified read-only on 28 October 2026.
-- Synthetic local rehearsal only; contains no hosted user or file data.
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  avatar_path text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username)
);
alter table public.profiles enable row level security;
grant all on public.profiles to anon, authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_username text;
begin
  v_username := lower(nullif(trim(new.raw_user_meta_data->>'username'), ''));
  if v_username is null then
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username) values (new.id, v_username);
  return new;
end;
$$;

create or replace function public.is_username_available(u text)
returns boolean language sql stable as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(u))
  );
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create policy profiles_read_all on public.profiles for select to public using (true);
create policy profiles_update_own on public.profiles for update to public
using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_insert_none on public.profiles for insert to public with check (false);
create policy profiles_delete_none on public.profiles for delete to public using (false);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy avatars_select_public on storage.objects for select to public
using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
create policy avatars_update_own on storage.objects for update to authenticated
using (bucket_id = 'avatars' and name like auth.uid()::text || '/%')
with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
create policy avatars_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
