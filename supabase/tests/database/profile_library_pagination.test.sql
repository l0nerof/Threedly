begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000b001', 'library-owner@example.test', '{"username":"library_owner"}'),
  ('00000000-0000-0000-0000-00000000b002', 'library-other@example.test', '{"username":"library_other"}'),
  ('00000000-0000-0000-0000-00000000b003', 'library-empty@example.test', '{"username":"library_empty"}');
insert into auth.users (id, email, raw_user_meta_data)
select ('00000000-0000-0000-0000-00000000c' || lpad(n::text, 3, '0'))::uuid,
  'library-designer-' || n || '@example.test', jsonb_build_object('username', 'library_designer_' || n)
from generate_series(1, 25) as n;

insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000b101', 'library-test', 'Library', 'Library');
insert into public.categories (id, group_id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000b102', '00000000-0000-0000-0000-00000000b101', 'library-test', 'Library', 'Library');
insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, cover_image_path, preview_model_path, status, minimum_plan)
select ('00000000-0000-0000-0000-00000000b' || lpad(n::text, 3, '0'))::uuid,
  case when n in (227, 228) then '00000000-0000-0000-0000-00000000b001'::uuid
    else '00000000-0000-0000-0000-00000000b002'::uuid end,
  '00000000-0000-0000-0000-00000000b102', 'library-model-' || n, 'Модель ' || n, 'Model ' || n,
  '/logo.png', 'private/preview.glb',
  (case n when 227 then 'draft' when 228 then 'archived' else 'published' end)::public.model_status,
  'max'
from generate_series(201, 229) as n;
insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, cover_image_path, status)
select ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000b102',
  'library-portfolio-' || n, 'Portfolio', 'Portfolio', '/logo.png', 'published'
from generate_series(1, 1001) as n;

insert into public.downloads (user_id, model_id, created_at)
select '00000000-0000-0000-0000-00000000b001', id, '2026-01-01T00:00:00Z'
from public.models where slug like 'library-model-%';
insert into public.downloads (user_id, model_id, created_at)
select '00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b201', '2025-01-01T00:00:00Z'
from generate_series(1, 1001);
insert into public.downloads (user_id, model_id, created_at) values
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b226', '2026-02-01T00:00:00Z'),
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000b202', '2026-03-01T00:00:00Z');
insert into public.favorites (user_id, model_id, created_at)
select '00000000-0000-0000-0000-00000000b001', id, '2026-01-01T00:00:00Z'
from public.models where slug like 'library-model-%';
insert into public.favorites (user_id, model_id) values
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000b202');
insert into public.designer_follows (follower_id, designer_id, created_at)
select '00000000-0000-0000-0000-00000000b001', id, '2026-01-01T00:00:00Z'
from public.profiles where username like 'library_designer_%';
insert into public.designer_follows (follower_id, designer_id) values
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000b001');
delete from public.models where id = '00000000-0000-0000-0000-00000000b229';

create temporary table library_before_read as select
  (select count(*) from public.downloads) as history,
  (select sum(download_count) from public.models) as popularity,
  (select sum(downloads_used_this_month) from public.profiles) as usage,
  (select count(*) from public.favorites) as favorites,
  (select count(*) from public.designer_follows) as follows;

select has_function('public', 'get_profile_library_page', array['text', 'integer'], 'library RPC exists');
select ok(not (select prosecdef from pg_proc where oid = 'public.get_profile_library_page(text,integer)'::regprocedure), 'caller permissions and RLS stay in force');
select is((select provolatile::text from pg_proc where oid = 'public.get_profile_library_page(text,integer)'::regprocedure), 's', 'library reads are stable');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.get_profile_library_page(text,integer)'::regprocedure), 'search path is pinned');
select is((select pronargs::integer from pg_proc where oid = 'public.get_profile_library_page(text,integer)'::regprocedure), 2, 'only tab and page may be supplied');
select ok(has_function_privilege('authenticated', 'public.get_profile_library_page(text,integer)', 'execute'), 'signed-in role has execute');
-- Do not execute forbidden functions on the affected local PostgreSQL image.
select ok(not has_function_privilege('anon', 'public.get_profile_library_page(text,integer)', 'execute'), 'guest role has no execute');
select ok(not exists (
  select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
  where p.oid = 'public.get_profile_library_page(text,integer)'::regprocedure and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
), 'PUBLIC has no execute');

set local role authenticated;
set local request.jwt.claim.sub = '';
select is((select count(*) from public.get_profile_library_page()), 0::bigint, 'no session returns no data');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000b099';
select is((select count(*) from public.get_profile_library_page()), 0::bigint, 'missing profile returns no data');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000b001';
select is((select profile_id::text from public.get_profile_library_page()), '00000000-0000-0000-0000-00000000b001', 'profile belongs to caller');
select is((select downloaded_count from public.get_profile_library_page()), 26::bigint, 'downloads are unique across months, not capped at 24 or 1000');
select is((select favorite_count from public.get_profile_library_page()), 26::bigint, 'favorites exclude own drafts, archived and deleted models');
select is((select followed_count from public.get_profile_library_page()), 25::bigint, 'follow count excludes another user');
select is((select total_pages from public.get_profile_library_page()), 2::bigint, 'download page count uses full unique count');
select is((select jsonb_array_length(models) from public.get_profile_library_page()), 24, 'first page is bounded to 24 cards');
select is((select models->0->>'id' from public.get_profile_library_page()), '00000000-0000-0000-0000-00000000b226', 'latest history event comes first');
select is((select models->1->>'id' from public.get_profile_library_page()), '00000000-0000-0000-0000-00000000b201', 'equal timestamps use model ID to break ties');
select is((select models->23->>'id' from public.get_profile_library_page()), '00000000-0000-0000-0000-00000000b223', 'stable first-page boundary');
select is((select jsonb_array_length(models) from public.get_profile_library_page('downloaded', 2)), 2, 'remaining models appear on second page');
select is((select models->0->>'id' from public.get_profile_library_page('downloaded', 2)), '00000000-0000-0000-0000-00000000b224', 'second page does not overlap first');
select is((select models->1->>'id' from public.get_profile_library_page('downloaded', 2)), '00000000-0000-0000-0000-00000000b225', 'last unique model is reachable');
select is((select designers from public.get_profile_library_page()), '[]'::jsonb, 'inactive designer payload is empty');
select ok(not (select models->0 ?| array['preview_model_path', 'creator_id', 'saved_at', 'object_path'] from public.get_profile_library_page()), 'model cards contain only public summary fields');
select is((select models->0->>'minimum_plan' from public.get_profile_library_page()), 'max', 'a saved model remains visible above current Free plan');
select is((select current_page from public.get_profile_library_page('downloaded', 2147483647)), 2, 'huge page clamps without overflow');
select is((select current_page from public.get_profile_library_page('downloaded', -2)), 1, 'negative page normalizes');
select is((select current_page from public.get_profile_library_page('downloaded', null)), 1, 'null page normalizes');
select is((select active_tab from public.get_profile_library_page('invalid', 1)), 'downloaded', 'unknown tab normalizes');
select is((select active_tab from public.get_profile_library_page(null, 1)), 'downloaded', 'null tab normalizes');
select is((select models->0->>'id' from public.get_profile_library_page('favoriteModels', 1)), '00000000-0000-0000-0000-00000000b201', 'favorites use their own stable order');
select is((select models->0->>'id' from public.get_profile_library_page('favoriteModels', 2)), '00000000-0000-0000-0000-00000000b225', 'favorite page two is reachable');
select is((select jsonb_array_length(designers) from public.get_profile_library_page('subscriptions', 1)), 24, 'designer first page is bounded');
select is((select jsonb_array_length(designers) from public.get_profile_library_page('subscriptions', 2)), 1, 'last followed designer is reachable');
select is((select designers->0->>'id' from public.get_profile_library_page('subscriptions', 2)), '00000000-0000-0000-0000-00000000c025', 'designer ordering has stable ID ties');
select is((select models from public.get_profile_library_page('subscriptions', 1)), '[]'::jsonb, 'inactive model payload is empty');
select is((select (designers->0->>'model_count')::integer from public.get_profile_library_page('subscriptions', 1)), 1001, 'portfolio count is not truncated by REST row limit');
select ok(not (select designers->0 ?| array['can_upload', 'downloads_used_this_month', 'downloads_limit_monthly', 'saved_at'] from public.get_profile_library_page('subscriptions', 1)), 'designer cards contain only public summary fields');
select is((select favorite_count from public.get_profile_library_page()), (select favorite_models from public.get_profile_overview()), 'favorite total matches overview');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000b002';
select is((select downloaded_count from public.get_profile_library_page()), 1::bigint, 'switching users isolates download count');
select is((select favorite_count from public.get_profile_library_page()), 1::bigint, 'switching users isolates favorite count');
select is((select followed_count from public.get_profile_library_page()), 1::bigint, 'switching users isolates follow count');
select is((select models->0->>'id' from public.get_profile_library_page()), '00000000-0000-0000-0000-00000000b202', 'switching users isolates cards');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000b003';
select is((select downloaded_count + favorite_count + followed_count from public.get_profile_library_page()), 0::bigint, 'valid empty account has zero counts');
select is((select current_page from public.get_profile_library_page('favoriteModels', 99)), 1, 'empty section clamps to page one');
select is((select total_pages from public.get_profile_library_page('subscriptions', 99)), 1::bigint, 'empty section has one logical page');
select is((select models from public.get_profile_library_page()), '[]'::jsonb, 'empty account has no models');
select is((select designers from public.get_profile_library_page('subscriptions')), '[]'::jsonb, 'empty account has no designers');

reset role;
select results_eq(
  'select (select count(*) from public.downloads), (select sum(download_count) from public.models), (select sum(downloads_used_this_month) from public.profiles), (select count(*) from public.favorites), (select count(*) from public.designer_follows)',
  'select history, popularity, usage, favorites, follows from library_before_read',
  'library reads never mutate history, popularity, quota, favorites or follows'
);
select * from finish();
rollback;
