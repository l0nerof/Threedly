begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(43);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-0000-0000-00000000a001',
    'access-owner@example.test',
    '{"username":"access_owner","plan_key":"max","can_upload":true,"downloads_limit_monthly":9999}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000a002',
    'access-other@example.test',
    '{"username":"access_other"}'::jsonb
  );
select is(
  (select count(*) from public.profiles where id in (
    '00000000-0000-0000-0000-00000000a001',
    '00000000-0000-0000-0000-00000000a002'
  )),
  2::bigint,
  'auth signup still creates profiles after trigger permissions are restricted'
);
select is(
  (select plan_key::text from public.profiles where username = 'access_owner'),
  'free',
  'signup metadata cannot assign a paid plan'
);
select is(
  (select can_upload from public.profiles where username = 'access_owner'),
  false,
  'signup metadata cannot grant upload access'
);
select is(
  (select downloads_limit_monthly from public.profiles where username = 'access_owner'),
  5,
  'signup receives the Free quota and ignores a forged download limit'
);

insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000b001', 'access-test', 'Access test', 'Access test');
insert into public.categories (id, group_id, slug, name_ua, name_en)
values (
  '00000000-0000-0000-0000-00000000b002',
  '00000000-0000-0000-0000-00000000b001',
  'access-test', 'Access test', 'Access test'
);

set local role anon;
select is((select count(*) from public.categories where slug = 'access-test'), 1::bigint, 'guests can browse categories');
select is((select count(*) from public.category_groups where slug = 'access-test'), 1::bigint, 'guests can browse category groups');
select is((select count(*) from public.profiles where username = 'access_owner'), 1::bigint, 'public designer profiles remain readable');
select is(public.is_username_available('access_owner'), false, 'guests can check an existing username');
select is(public.is_username_available('access_unused'), true, 'guests can check an unused username');
select is(public.is_username_available(null), false, 'null usernames remain unavailable');
select is(public.is_username_available('  '), false, 'blank usernames remain unavailable');
select throws_ok($$update public.profiles set bio = 'changed' where username = 'access_owner'$$, '42501', 'permission denied for table profiles', 'guests cannot edit profiles');
select throws_ok($$insert into public.categories (slug, name_ua, name_en, group_id) values ('forbidden', 'Forbidden', 'Forbidden', '00000000-0000-0000-0000-00000000b001')$$, '42501', 'permission denied for table categories', 'guests cannot create categories');
select throws_ok($$update public.categories set name_en = 'changed' where slug = 'access-test'$$, '42501', 'permission denied for table categories', 'guests cannot edit categories');
select throws_ok($$delete from public.categories where slug = 'access-test'$$, '42501', 'permission denied for table categories', 'guests cannot delete categories');
select throws_ok($$truncate public.categories cascade$$, '42501', 'permission denied for table categories', 'guests cannot truncate categories');
select throws_ok($$insert into public.category_groups (slug, name_ua, name_en) values ('forbidden', 'Forbidden', 'Forbidden')$$, '42501', 'permission denied for table category_groups', 'guests cannot create category groups');
select throws_ok($$update public.category_groups set name_en = 'changed' where slug = 'access-test'$$, '42501', 'permission denied for table category_groups', 'guests cannot edit category groups');
select throws_ok($$delete from public.category_groups where slug = 'access-test'$$, '42501', 'permission denied for table category_groups', 'guests cannot delete category groups');
select throws_ok($$truncate public.category_groups cascade$$, '42501', 'permission denied for table category_groups', 'guests cannot truncate category groups');
select ok(
  not has_function_privilege(current_user, 'public.handle_new_user()', 'execute')
  and not has_function_privilege(current_user, 'public.set_updated_at()', 'execute'),
  'guests cannot directly execute trigger functions'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000a001';

select lives_ok(
  $$update public.profiles set username = 'access_renamed', bio = 'New bio', avatar_path = 'avatar.webp' where id = '00000000-0000-0000-0000-00000000a001'$$,
  'owners can still edit their public profile fields'
);
select results_eq(
  $$select username, bio, avatar_path from public.profiles where id = '00000000-0000-0000-0000-00000000a001'$$,
  $$values ('access_renamed'::text, 'New bio'::text, 'avatar.webp'::text)$$,
  'public profile changes are saved'
);
select results_eq(
  $$update public.profiles set bio = 'changed' where id = '00000000-0000-0000-0000-00000000a002' returning id$$,
  array[]::uuid[],
  'RLS prevents editing another profile'
);
select throws_ok($$insert into public.profiles (id, username) values ('00000000-0000-0000-0000-00000000a001', 'forged_profile')$$, '42501', 'permission denied for table profiles', 'profiles cannot be created directly through the user API');
select throws_ok($$update public.profiles set plan_key = 'max' where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot change their plan');
select throws_ok($$update public.profiles set downloads_used_this_month = 0 where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot reset their download usage');
select throws_ok($$update public.profiles set downloads_limit_monthly = 9999 where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot increase their quota');
select throws_ok($$update public.profiles set can_upload = true where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot grant themselves upload access');
select throws_ok($$update public.profiles set id = '00000000-0000-0000-0000-00000000a003' where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot change profile ownership');
select throws_ok($$update public.profiles set created_at = now() where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot change creation timestamps');
select throws_ok($$update public.profiles set updated_at = now() where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'updated timestamps remain controlled by the trigger');
select throws_ok($$delete from public.profiles where id = '00000000-0000-0000-0000-00000000a001'$$, '42501', 'permission denied for table profiles', 'owners cannot bypass profile creation rules by deleting their profile');
select throws_ok($$truncate public.profiles cascade$$, '42501', 'permission denied for table profiles', 'users cannot truncate profiles');
select throws_ok($$update public.categories set name_en = 'changed' where slug = 'access-test'$$, '42501', 'permission denied for table categories', 'signed-in users cannot edit categories');
select throws_ok($$update public.category_groups set name_en = 'changed' where slug = 'access-test'$$, '42501', 'permission denied for table category_groups', 'signed-in users cannot edit category groups');
select ok(
  not has_function_privilege(current_user, 'public.handle_new_user()', 'execute')
  and not has_function_privilege(current_user, 'public.set_updated_at()', 'execute'),
  'signed-in users cannot directly execute trigger functions'
);
select is(public.is_username_available('ACCESS_RENAMED '), false, 'username checks still normalize names under the caller permissions');

reset role;
set local role service_role;
select lives_ok(
  $$update public.profiles set plan_key = 'pro', downloads_limit_monthly = 25, can_upload = true where id = '00000000-0000-0000-0000-00000000a001'$$,
  'administrative access can assign beta plans and quota'
);
select results_eq(
  $$select plan_key::text, downloads_limit_monthly, can_upload from public.profiles where id = '00000000-0000-0000-0000-00000000a001'$$,
  $$values ('pro'::text, 25, true)$$,
  'manual beta plan assignment is saved'
);
select lives_ok($$update public.categories set name_en = 'Admin category' where slug = 'access-test'$$, 'administrators can manage categories');
select lives_ok($$update public.category_groups set name_en = 'Admin group' where slug = 'access-test'$$, 'administrators can manage category groups');

reset role;
select ok(
  (select bool_and(relrowsecurity) from pg_class where oid in ('public.categories'::regclass, 'public.category_groups'::regclass)),
  'both category tables have RLS enabled'
);
select * from finish();
rollback;
