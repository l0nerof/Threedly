begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(36);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000f001', 'overview-owner@example.test', '{"username":"overview_owner"}'::jsonb),
  ('00000000-0000-0000-0000-00000000f002', 'overview-other@example.test', '{"username":"overview_other"}'::jsonb),
  ('00000000-0000-0000-0000-00000000f003', 'overview-empty@example.test', '{"username":"overview_empty"}'::jsonb);

update public.profiles set plan_key = 'pro', downloads_limit_monthly = 25, downloads_used_this_month = 23 where username = 'overview_owner';
update public.profiles set plan_key = 'max', downloads_limit_monthly = 100 where username = 'overview_other';

insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000f101', 'overview-stats', 'Overview', 'Overview');
insert into public.categories (id, group_id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000f102', '00000000-0000-0000-0000-00000000f101', 'overview-stats', 'Overview', 'Overview');

insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, minimum_plan)
select
  ('00000000-0000-0000-0000-00000000f' || fixture.suffix)::uuid,
  ('00000000-0000-0000-0000-00000000f' || fixture.creator)::uuid,
  '00000000-0000-0000-0000-00000000f102',
  'overview-' || fixture.suffix, 'Overview model', 'Overview model', '/logo.png',
  fixture.status::public.model_status, fixture.minimum_plan::public.plan_key
from (values
  ('201', '001', 'published', 'free'), ('202', '001', 'published', 'free'),
  ('203', '001', 'draft', 'free'), ('204', '001', 'archived', 'free'),
  ('205', '002', 'published', 'max'), ('206', '002', 'draft', 'free'),
  ('207', '002', 'published', 'free')
) as fixture(suffix, creator, status, minimum_plan);

insert into public.downloads (user_id, model_id, created_at)
values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f201', date_trunc('month', now() at time zone 'UTC') at time zone 'UTC'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f202', ((date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC') - interval '1 microsecond'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f204', now()),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f207', now()),
  ('00000000-0000-0000-0000-00000000f001', null, now()),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f205', (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC') - interval '1 microsecond'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f205', (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC'),
  ('00000000-0000-0000-0000-00000000f001', null, (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC') - interval '1 microsecond'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000f205', now());

insert into public.downloads (user_id, model_id, created_at)
select '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f201',
  (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC') + interval '1 second'
from generate_series(1, 1001);

insert into public.favorites (user_id, model_id)
values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f201'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f203'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f204'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f205'),
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000f206'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000f202');

delete from public.models where id = '00000000-0000-0000-0000-00000000f207';
create temporary table overview_before_read as
select
  (select downloads_used_this_month from public.profiles where username = 'overview_owner') as cached_usage,
  (select count(*) from public.downloads where user_id = '00000000-0000-0000-0000-00000000f001') as history_count,
  (select sum(download_count) from public.models where category_id = '00000000-0000-0000-0000-00000000f102') as popularity;

select has_function('public', 'get_profile_overview', array[]::text[], 'the overview RPC exists');
select ok(not (select prosecdef from pg_proc where oid = 'public.get_profile_overview()'::regprocedure), 'the RPC preserves caller permissions');
select is((select provolatile::text from pg_proc where oid = 'public.get_profile_overview()'::regprocedure), 's', 'the RPC is stable and read-only');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.get_profile_overview()'::regprocedure), 'the search path is pinned');
select is((select pronargs::integer from pg_proc where oid = 'public.get_profile_overview()'::regprocedure), 0, 'callers cannot supply another user ID');
select ok(has_function_privilege('authenticated', 'public.get_profile_overview()', 'execute'), 'authenticated users may call the RPC');
-- Avoid executing forbidden functions on the affected local PostgreSQL image.
select ok(not has_function_privilege('anon', 'public.get_profile_overview()', 'execute'), 'guests cannot call the RPC');
select ok(not exists (
  select 1 from pg_proc as p,
    lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
  where p.oid = 'public.get_profile_overview()'::regprocedure and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
), 'PUBLIC has no default execute grant');

set local role authenticated;
set local request.jwt.claim.sub = '';
select is((select count(*) from public.get_profile_overview()), 0::bigint, 'a role without a user sees no profile');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f099';
select is((select count(*) from public.get_profile_overview()), 0::bigint, 'a missing profile does not produce invented zero statistics');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f001';
select is((select count(*) from public.get_profile_overview()), 1::bigint, 'only the current profile is returned');
select is((select profile_id from public.get_profile_overview()), '00000000-0000-0000-0000-00000000f001'::uuid, 'the profile ID comes from the current user');
select is((select plan_key::text from public.get_profile_overview()), 'pro', 'the actual assigned plan is returned');
select is((select downloads_limit_monthly from public.get_profile_overview()), 25, 'the actual profile limit is returned');
select is((select downloads_used_this_month from public.get_profile_overview()), 5::bigint, 'UTC boundaries, deleted models and more than 1000 duplicate events use quota semantics, not the stale cache');
select is((select published_uploads from public.get_profile_overview()), 2::bigint, 'only own published uploads count');
select is((select favorite_models from public.get_profile_overview()), 2::bigint, 'favorites count published models, including higher-plan models, but not drafts or archives');

set local timezone = 'Pacific/Kiritimati';
select is((select downloads_used_this_month from public.get_profile_overview()), 5::bigint, 'a positive timezone offset does not change UTC quota boundaries');
set local timezone = 'America/Los_Angeles';
select is((select downloads_used_this_month from public.get_profile_overview()), 5::bigint, 'a negative timezone offset does not change UTC quota boundaries');
set local timezone = 'UTC';

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f003';
select is((select plan_key::text from public.get_profile_overview()), 'free', 'an empty profile has its actual Free plan');
select is((select downloads_limit_monthly from public.get_profile_overview()), 5, 'an empty Free profile has five downloads');
select is((select downloads_used_this_month from public.get_profile_overview()), 0::bigint, 'an empty history has zero usage');
select is((select published_uploads from public.get_profile_overview()), 0::bigint, 'an empty portfolio has zero published uploads');
select is((select favorite_models from public.get_profile_overview()), 0::bigint, 'an empty favorites list has zero models');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f002';
select is((select profile_id from public.get_profile_overview()), '00000000-0000-0000-0000-00000000f002'::uuid, 'switching users changes the returned profile');
select is((select plan_key::text from public.get_profile_overview()), 'max', 'another user has their own Max plan');
select is((select downloads_used_this_month from public.get_profile_overview()), 1::bigint, 'another user cannot inherit the first user history');
select is((select published_uploads from public.get_profile_overview()), 1::bigint, 'another user sees only their own published uploads');
select is((select favorite_models from public.get_profile_overview()), 1::bigint, 'another user sees only their own favorites');

reset role;
select results_eq(
  $$select
    (select downloads_used_this_month from public.profiles where username = 'overview_owner'),
    (select count(*) from public.downloads where user_id = '00000000-0000-0000-0000-00000000f001'),
    (select sum(download_count) from public.models where category_id = '00000000-0000-0000-0000-00000000f102')$$,
  $$select * from overview_before_read$$,
  'reading statistics does not mutate cached usage, history or popularity'
);

update public.profiles set plan_key = 'free', downloads_limit_monthly = 0, downloads_used_this_month = 0 where username = 'overview_owner';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f001';
select is((select downloads_limit_monthly from public.get_profile_overview()), 0, 'an administrative zero limit is respected');
select is((select downloads_used_this_month from public.get_profile_overview()), 5::bigint, 'usage can exceed a lowered limit without disappearing');

reset role;
update public.profiles set plan_key = 'pro', downloads_limit_monthly = 7, downloads_used_this_month = 7 where username = 'overview_owner';
set local role authenticated;
select is((select downloads_limit_monthly from public.get_profile_overview()), 7, 'custom positive limits are not replaced by the tier default');
reset role;
update public.downloads set created_at = (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC') - interval '1 microsecond'
where user_id = '00000000-0000-0000-0000-00000000f001';
set local role authenticated;
select is((select downloads_used_this_month from public.get_profile_overview()), 0::bigint, 'history outside the UTC month resets displayed usage despite a stale cache');
select is((select downloads_used_this_month from public.profiles where username = 'overview_owner'), 7, 'reading fresh usage does not rewrite the stale cache');
select is((select plan_key::text from public.get_profile_overview()), 'pro', 'a manual plan change is reflected without cached claims');

select * from finish();
rollback;
