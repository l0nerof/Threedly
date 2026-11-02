revoke all privileges on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (username, bio, avatar_path) on table public.profiles to authenticated;

drop policy if exists "Profiles are insertable by the owner" on public.profiles;

alter table public.categories enable row level security;
alter table public.category_groups enable row level security;

revoke all privileges on table public.categories, public.category_groups
  from public, anon, authenticated;
grant select on table public.categories, public.category_groups to anon, authenticated;

create policy "Categories are publicly readable"
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy "Category groups are publicly readable"
  on public.category_groups
  for select
  to anon, authenticated
  using (true);

alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.is_username_available(text) set search_path = '';
alter function public.is_username_available(text) security invoker;

revoke execute on function public.set_updated_at(), public.handle_new_user()
  from public, anon, authenticated;
revoke execute on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
