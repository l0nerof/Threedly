create table if not exists public.category_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ua text not null,
  name_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.categories
  add column if not exists group_id uuid references public.category_groups (id) on delete restrict;

alter table public.categories
  add column if not exists sort_order integer not null default 0;

alter table public.categories
  add column if not exists is_featured boolean not null default false;

alter table public.categories
  alter column group_id set not null;

create index if not exists category_groups_sort_idx
  on public.category_groups (sort_order, slug);

create index if not exists categories_group_sort_idx
  on public.categories (group_id, sort_order, slug);
