create table if not exists public.designer_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  designer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, designer_id),
  constraint designer_follows_no_self_follow_check
    check (follower_id <> designer_id)
);

create index if not exists designer_follows_designer_idx
  on public.designer_follows (designer_id);

create index if not exists designer_follows_follower_created_at_idx
  on public.designer_follows (follower_id, created_at desc);

alter table public.designer_follows enable row level security;

create policy "Designer follows are readable by the follower"
  on public.designer_follows
  for select
  to authenticated
  using ((select auth.uid()) = follower_id);

create policy "Designer follows are insertable by the follower"
  on public.designer_follows
  for insert
  to authenticated
  with check ((select auth.uid()) = follower_id);

create policy "Designer follows are deletable by the follower"
  on public.designer_follows
  for delete
  to authenticated
  using ((select auth.uid()) = follower_id);
