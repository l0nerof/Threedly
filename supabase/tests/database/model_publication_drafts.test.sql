begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(54);

create temporary table publication_draft_baseline as
select
  (select count(*) from public.models) as models,
  (select count(*) from public.model_files) as files,
  (select count(*) from storage.objects) as objects;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000e001', 'publication-owner@example.test', '{"username":"publication_owner"}'::jsonb),
  ('00000000-0000-0000-0000-00000000e002', 'publication-other@example.test', '{"username":"publication_other"}'::jsonb),
  ('00000000-0000-0000-0000-00000000e003', 'publication-blocked@example.test', '{"username":"publication_blocked","can_upload":true}'::jsonb);
update public.profiles set can_upload = true
where id in ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002');

insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000e101', 'publication-draft-test', 'Draft test', 'Draft test');
insert into public.categories (id, group_id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-00000000e101', 'publication-draft-test', 'Draft test', 'Draft test');
insert into public.model_publication_drafts (id, creator_id, title_ua)
values ('00000000-0000-0000-0000-00000000e202', '00000000-0000-0000-0000-00000000e002', 'Foreign draft');

select has_table('public', 'model_publication_drafts', 'publication drafts have a separate table');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.model_publication_drafts'::regclass),
  'draft RLS is enabled'
);
select is(
  (select array_agg(column_name::text order by column_name) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'model_publication_drafts'
     and grantee = 'authenticated' and privilege_type = 'INSERT'),
  array['category_id', 'description_en', 'description_ua', 'minimum_plan', 'title_en', 'title_ua'],
  'INSERT grants only the six editable content columns'
);
select is(
  (select array_agg(column_name::text order by column_name) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'model_publication_drafts'
     and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  array['category_id', 'description_en', 'description_ua', 'minimum_plan', 'title_en', 'title_ua'],
  'UPDATE grants only the six editable content columns'
);
select ok(
  not has_table_privilege('authenticated', 'public.model_publication_drafts', 'INSERT')
  and not has_table_privilege('authenticated', 'public.model_publication_drafts', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.model_publication_drafts', 'DELETE')
  and not has_table_privilege('authenticated', 'public.model_publication_drafts', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.model_publication_drafts', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.model_publication_drafts', 'TRIGGER'),
  'no broad authenticated write or structural privileges survive defaults'
);
select ok(
  not has_table_privilege('anon', 'public.model_publication_drafts', 'SELECT')
  and not has_any_column_privilege('anon', 'public.model_publication_drafts', 'INSERT')
  and not has_any_column_privilege('anon', 'public.model_publication_drafts', 'UPDATE'),
  'guests have no draft read or write grants'
);
select ok(
  (select not prosecdef and proconfig = array['search_path=""']
   from pg_proc where oid = 'private.touch_model_publication_draft()'::regprocedure),
  'the timestamp trigger is security invoker with an empty search path'
);
select ok(
  not has_function_privilege('anon', 'private.touch_model_publication_draft()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.touch_model_publication_draft()', 'EXECUTE')
  and not has_function_privilege('service_role', 'private.touch_model_publication_draft()', 'EXECUTE'),
  'application roles cannot directly execute the private trigger function'
);
select ok(
  not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'model_publication_drafts'
      and column_name in ('status', 'published_at', 'cover_image_path', 'preview_model_path')),
  'draft records do not duplicate public model status or raw public asset paths'
);

set local role anon;
select throws_ok(
  $$select * from public.model_publication_drafts$$,
  '42501', 'permission denied for table model_publication_drafts', 'guests cannot read drafts'
);
select throws_ok(
  $$insert into public.model_publication_drafts (title_ua) values ('Guest')$$,
  '42501', 'permission denied for table model_publication_drafts', 'guests cannot create drafts'
);

set local role authenticated;
set local request.jwt.claim.sub = '';
select is((select count(*) from public.model_publication_drafts), 0::bigint, 'a role without an authenticated identity reads no drafts');
select throws_ok(
  $$insert into public.model_publication_drafts (title_ua) values ('No identity')$$,
  '42501', 'new row violates row-level security policy for table "model_publication_drafts"', 'an authenticated role alone cannot create a draft'
);
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000e003';
select throws_ok(
  $$insert into public.model_publication_drafts (title_ua) values ('Blocked')$$,
  '42501', 'new row violates row-level security policy for table "model_publication_drafts"', 'user-editable metadata does not grant creator access'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000e001';
select lives_ok(
  $$insert into public.model_publication_drafts (title_ua) values ('')$$,
  'a permitted creator can save without titles, descriptions, category or files'
);
select is((select count(*) from public.model_publication_drafts), 1::bigint, 'an unfiltered read exposes only the current creator draft');
select ok(
  (select title_ua = '' and title_en = '' and description_ua is null
    and description_en is null and category_id is null and minimum_plan = 'free'
   from public.model_publication_drafts),
  'partial content defaults do not fabricate publication-ready data'
);
select ok(
  (select id is not null and creator_id = auth.uid() and created_at = updated_at and created_at = now()
   from public.model_publication_drafts),
  'the database assigns identity, ownership and initial timestamps'
);
select is(
  (select count(*) from public.model_publication_drafts where id = '00000000-0000-0000-0000-00000000e202'),
  0::bigint, 'knowing a foreign draft ID does not expose it'
);
with changed as (
  update public.model_publication_drafts set title_ua = 'Intrusion'
  where id = '00000000-0000-0000-0000-00000000e202' returning id
)
select is(
  (select count(*) from changed),
  0::bigint, 'a direct update cannot change a foreign draft'
);

set local timezone = 'Pacific/Honolulu';
with changed as (
  update public.model_publication_drafts set title_ua = 'Д', description_en = 'Work in progress'
  returning title_ua, category_id, created_at, updated_at
)
select ok(
  (select title_ua = 'Д' and category_id is null and updated_at = statement_timestamp()
      and updated_at >= created_at from changed),
  'one-character titles save and the trigger uses the actual statement time across timezones'
);
set local timezone = 'UTC';
select is(
  (select description_en from public.model_publication_drafts),
  'Work in progress', 'a separate read restores saved draft content'
);
select lives_ok(
  $$update public.model_publication_drafts set title_ua = repeat('ї', 90), title_en = repeat('a', 90),
    description_ua = repeat('є', 600), description_en = repeat('b', 600),
    category_id = '00000000-0000-0000-0000-00000000e102', minimum_plan = 'max'$$,
  'Unicode character bounds and existing category/plan values are accepted'
);
select throws_ok(
  $$update public.model_publication_drafts set title_ua = repeat('ї', 91)$$,
  '23514', 'new row for relation "model_publication_drafts" violates check constraint "model_publication_drafts_title_ua_length_check"', 'oversized Ukrainian titles are rejected'
);
select throws_ok(
  $$update public.model_publication_drafts set title_en = repeat('a', 91)$$,
  '23514', 'new row for relation "model_publication_drafts" violates check constraint "model_publication_drafts_title_en_length_check"', 'oversized English titles are rejected'
);
select throws_ok(
  $$update public.model_publication_drafts set description_ua = repeat('є', 601)$$,
  '23514', 'new row for relation "model_publication_drafts" violates check constraint "model_publication_drafts_description_ua_length_check"', 'oversized Ukrainian descriptions are rejected'
);
select throws_ok(
  $$update public.model_publication_drafts set description_en = repeat('b', 601)$$,
  '23514', 'new row for relation "model_publication_drafts" violates check constraint "model_publication_drafts_description_en_length_check"', 'oversized English descriptions are rejected'
);
select throws_ok(
  $$update public.model_publication_drafts set category_id = '00000000-0000-0000-0000-00000000e999'$$,
  '23503', 'insert or update on table "model_publication_drafts" violates foreign key constraint "model_publication_drafts_category_id_fkey"', 'unknown categories are rejected'
);
select throws_ok(
  $$update public.model_publication_drafts set minimum_plan = 'business'$$,
  '22P02', 'invalid input value for enum plan_key: "business"', 'drafts use the existing plan enum'
);
select throws_ok(
  $$update public.model_publication_drafts set title_ua = null$$,
  '23502', null, 'null does not bypass the Ukrainian title contract'
);
select throws_ok(
  $$update public.model_publication_drafts set title_en = null$$,
  '23502', null, 'null does not bypass the English title contract'
);
select lives_ok(
  $$update public.model_publication_drafts set title_ua = 'Saved draft', title_en = '', description_ua = null, description_en = ''$$,
  'content can be cleared back to an unfinished draft'
);

select throws_ok(
  $$insert into public.model_publication_drafts (id, title_ua) values ('00000000-0000-0000-0000-00000000e201', 'Forged ID')$$,
  '42501', 'permission denied for table model_publication_drafts', 'direct inserts cannot choose an ID outside the authorized create RPC'
);
select throws_ok(
  $$insert into public.model_publication_drafts (creator_id, title_ua) values ('00000000-0000-0000-0000-00000000e002', 'Forged owner')$$,
  '42501', 'permission denied for table model_publication_drafts', 'users cannot supply another creator at insertion'
);
select throws_ok(
  $$insert into public.model_publication_drafts (created_at, title_ua) values ('2000-01-01T00:00:00Z', 'Forged creation')$$,
  '42501', 'permission denied for table model_publication_drafts', 'creation timestamps cannot be supplied by users'
);
select throws_ok(
  $$insert into public.model_publication_drafts (updated_at, title_ua) values ('2000-01-01T00:00:00Z', 'Forged update')$$,
  '42501', 'permission denied for table model_publication_drafts', 'update timestamps cannot be supplied by users'
);
select throws_ok(
  $$update public.model_publication_drafts set creator_id = '00000000-0000-0000-0000-00000000e002'$$,
  '42501', 'permission denied for table model_publication_drafts', 'draft ownership cannot be reassigned'
);
select throws_ok(
  $$update public.model_publication_drafts set id = '00000000-0000-0000-0000-00000000e201'$$,
  '42501', 'permission denied for table model_publication_drafts', 'draft IDs cannot be changed'
);
select throws_ok(
  $$update public.model_publication_drafts set created_at = '2000-01-01T00:00:00Z'$$,
  '42501', 'permission denied for table model_publication_drafts', 'creation timestamps cannot be changed'
);
select throws_ok(
  $$update public.model_publication_drafts set updated_at = '2000-01-01T00:00:00Z'$$,
  '42501', 'permission denied for table model_publication_drafts', 'update timestamps cannot be forged'
);
select throws_ok(
  $$delete from public.model_publication_drafts$$,
  '42501', 'permission denied for table model_publication_drafts', 'direct deletion cannot bypass asset cleanup'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000e002';
select is(
  (select array_agg(title_ua) from public.model_publication_drafts),
  array['Foreign draft'], 'switching identities reveals only the other creator draft'
);
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000e001';
select is(
  (select title_ua from public.model_publication_drafts),
  'Saved draft', 'returning to the creator restores saved data after failed writes'
);

reset role;
update public.profiles set can_upload = false where id = '00000000-0000-0000-0000-00000000e001';
set local role authenticated;
select is((select count(*) from public.model_publication_drafts), 1::bigint, 'revocation does not hide existing own draft text');
select lives_ok(
  $$update public.model_publication_drafts set description_ua = 'Still editable'$$,
  'revocation preserves editing of existing own metadata'
);
select throws_ok(
  $$insert into public.model_publication_drafts (title_ua) values ('Revoked')$$,
  '42501', 'new row violates row-level security policy for table "model_publication_drafts"', 'revocation blocks the next draft creation'
);
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000e004';
select throws_ok(
  $$insert into public.model_publication_drafts (title_ua) values ('Missing profile')$$,
  '42501', 'new row violates row-level security policy for table "model_publication_drafts"', 'an identity without a profile cannot create drafts'
);

reset role;
delete from public.categories where id = '00000000-0000-0000-0000-00000000e102';
select ok(
  (select category_id is null and title_ua = 'Saved draft' from public.model_publication_drafts
   where creator_id = '00000000-0000-0000-0000-00000000e001'),
  'removing a category preserves unfinished content without a dangling reference'
);

set local role service_role;
select is(
  (select count(*) from public.model_publication_drafts
   where creator_id in ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002')),
  2::bigint, 'administrative access can inspect both fixture drafts'
);
reset role;
delete from public.profiles where id = '00000000-0000-0000-0000-00000000e002';
select is(
  (select count(*) from public.model_publication_drafts where id = '00000000-0000-0000-0000-00000000e202'),
  0::bigint, 'removing a creator profile cascades its metadata-only drafts'
);
select is(
  (select count(*) from public.model_publication_drafts where creator_id = '00000000-0000-0000-0000-00000000e001'),
  1::bigint, 'another creator draft survives profile cleanup'
);
select is((select count(*) from public.models), (select models from publication_draft_baseline), 'saving drafts never creates catalog models');
select is((select count(*) from public.model_files), (select files from publication_draft_baseline), 'saving draft metadata does not attach downloadable files');
select is((select count(*) from storage.objects), (select objects from publication_draft_baseline), 'this stage performs no Storage writes');

select * from finish();
rollback;
