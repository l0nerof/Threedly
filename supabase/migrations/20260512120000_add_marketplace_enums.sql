do $$
begin
  create type public.plan_key as enum ('free', 'pro', 'max');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.model_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.storage_provider as enum ('supabase', 'r2');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  alter column plan_key drop default,
  drop constraint if exists profiles_plan_key_check,
  alter column plan_key type public.plan_key using plan_key::public.plan_key,
  alter column plan_key set default 'free'::public.plan_key;

drop policy if exists "Published models are publicly readable" on public.models;
drop policy if exists "Creators can insert published models" on public.models;

alter table public.models
  alter column status drop default,
  alter column minimum_plan drop default,
  drop constraint if exists models_status_check,
  drop constraint if exists models_minimum_plan_check,
  alter column status type public.model_status using status::public.model_status,
  alter column minimum_plan type public.plan_key using minimum_plan::public.plan_key,
  alter column status set default 'draft'::public.model_status,
  alter column minimum_plan set default 'free'::public.plan_key;

alter table public.model_files
  drop constraint if exists model_files_storage_provider_check,
  alter column storage_provider type public.storage_provider using storage_provider::public.storage_provider;

create policy "Published models are publicly readable"
  on public.models
  for select
  to anon, authenticated
  using (status = 'published'::public.model_status);

create policy "Creators can insert published models"
  on public.models
  for insert
  to authenticated
  with check (
    creator_id = (select auth.uid())
    and status = 'published'::public.model_status
    and published_at is not null
  );
