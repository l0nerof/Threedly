create table public.model_publication_drafts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  title_ua text not null default '',
  title_en text not null default '',
  description_ua text,
  description_en text,
  category_id uuid references public.categories (id) on delete set null,
  minimum_plan public.plan_key not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint model_publication_drafts_title_ua_length_check
    check (char_length(title_ua) <= 90),
  constraint model_publication_drafts_title_en_length_check
    check (char_length(title_en) <= 90),
  constraint model_publication_drafts_description_ua_length_check
    check (description_ua is null or char_length(description_ua) <= 600),
  constraint model_publication_drafts_description_en_length_check
    check (description_en is null or char_length(description_en) <= 600)
);

create index model_publication_drafts_creator_updated_idx
  on public.model_publication_drafts (creator_id, updated_at desc, id);
create index model_publication_drafts_category_idx
  on public.model_publication_drafts (category_id);

alter table public.model_publication_drafts enable row level security;

revoke all privileges on table public.model_publication_drafts
  from public, anon, authenticated;
grant select on table public.model_publication_drafts to authenticated;
grant insert (title_ua, title_en, description_ua, description_en, category_id, minimum_plan)
  on table public.model_publication_drafts to authenticated;
grant update (title_ua, title_en, description_ua, description_en, category_id, minimum_plan)
  on table public.model_publication_drafts to authenticated;
grant all privileges on table public.model_publication_drafts to service_role;

create policy "Creators can read their own publication drafts"
  on public.model_publication_drafts
  for select to authenticated
  using (creator_id = (select auth.uid()));

create policy "Allowed creators can create publication drafts"
  on public.model_publication_drafts
  for insert to authenticated
  with check (
    creator_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and can_upload
    )
  );

create policy "Creators can edit their own publication drafts"
  on public.model_publication_drafts
  for update to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

create function private.touch_model_publication_draft()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

revoke all on function private.touch_model_publication_draft()
  from public, anon, authenticated, service_role;

create trigger set_model_publication_draft_updated_at
  before update on public.model_publication_drafts
  for each row execute function private.touch_model_publication_draft();
