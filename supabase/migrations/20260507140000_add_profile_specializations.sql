alter table public.profiles
  add column if not exists specializations text[] not null default '{}';
