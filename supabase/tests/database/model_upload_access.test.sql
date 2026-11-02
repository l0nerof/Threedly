begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(23);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000c001', 'upload-allowed@example.test', '{"username":"upload_allowed"}'::jsonb),
  ('00000000-0000-0000-0000-00000000c002', 'upload-blocked@example.test', '{"username":"upload_blocked"}'::jsonb);
update public.profiles set can_upload = true where id = '00000000-0000-0000-0000-00000000c001';

insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000c101', 'upload-access-test', 'Upload access', 'Upload access');
insert into public.categories (id, group_id, slug, name_ua, name_en)
values (
  '00000000-0000-0000-0000-00000000c102',
  '00000000-0000-0000-0000-00000000c101',
  'upload-access-test', 'Upload access', 'Upload access'
);
insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, published_at)
values (
  '00000000-0000-0000-0000-00000000c202',
  '00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-00000000c102',
  'upload-existing-blocked', 'Existing model', 'Existing model', '/logo.png', 'published', now()
);

set local role anon;
select throws_ok(
  $$insert into public.models (creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, published_at) values ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000c102', 'upload-guest', 'Guest model', 'Guest model', '/logo.png', 'published', now())$$,
  '42501', 'new row violates row-level security policy for table "models"', 'guests cannot publish models'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c002/guest.glb')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'guests cannot upload source files'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('model-images', '00000000-0000-0000-0000-00000000c002/guest.webp')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'guests cannot upload model covers'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000c002';
select throws_ok(
  $$insert into public.models (creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, published_at) values ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000c102', 'upload-blocked', 'Blocked model', 'Blocked model', '/logo.png', 'published', now())$$,
  '42501', 'new row violates row-level security policy for table "models"', 'accounts without upload access cannot publish models'
);
select throws_ok(
  $$insert into public.model_files (model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes) values ('00000000-0000-0000-0000-00000000c202', 'supabase', 'models', '00000000-0000-0000-0000-00000000c002/blocked.glb', 'blocked.glb', 'glb', 5)$$,
  '42501', 'new row violates row-level security policy for table "model_files"', 'accounts without upload access cannot attach files to existing models'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c002/blocked.glb')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'own source folder does not bypass upload permission'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c002/preview.glb')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'preview files require upload permission too'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('model-images', '00000000-0000-0000-0000-00000000c002/cover.webp')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'own cover folder does not bypass upload permission'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-00000000c002/avatar.webp')$$,
  'profile avatar uploads remain available without creator access'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000c001';
select lives_ok(
  $$insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, published_at) values ('00000000-0000-0000-0000-00000000c201', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c102', 'upload-allowed', 'Allowed model', 'Allowed model', '/logo.png', 'published', now())$$,
  'accounts with upload access can publish their own models'
);
select lives_ok(
  $$insert into public.model_files (model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes) values ('00000000-0000-0000-0000-00000000c201', 'supabase', 'models', '00000000-0000-0000-0000-00000000c001/allowed.glb', 'allowed.glb', 'glb', 5)$$,
  'accounts with upload access can attach their own model files'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c001/allowed.glb')$$,
  'accounts with upload access can store source files in their own folder'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c001/preview.glb')$$,
  'accounts with upload access can store their own preview files'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('model-images', '00000000-0000-0000-0000-00000000c001/cover.webp')$$,
  'accounts with upload access can store their own covers'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c002/foreign.glb')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'upload permission does not allow writing to another source folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('model-images', '00000000-0000-0000-0000-00000000c002/foreign.webp')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'upload permission does not allow writing to another cover folder'
);
select throws_ok(
  $$insert into public.models (creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, published_at) values ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000c102', 'upload-forged-creator', 'Foreign model', 'Foreign model', '/logo.png', 'published', now())$$,
  '42501', 'new row violates row-level security policy for table "models"', 'upload permission does not allow impersonating another creator'
);
select throws_ok(
  $$insert into public.model_files (model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes) values ('00000000-0000-0000-0000-00000000c202', 'supabase', 'models', '00000000-0000-0000-0000-00000000c001/foreign.glb', 'foreign.glb', 'glb', 5)$$,
  '42501', 'new row violates row-level security policy for table "model_files"', 'upload permission does not allow attaching files to another creator model'
);

reset role;
update public.profiles set can_upload = false where id = '00000000-0000-0000-0000-00000000c001';
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('models', '00000000-0000-0000-0000-00000000c001/revoked.glb')$$,
  '42501', 'new row violates row-level security policy for table "objects"', 'revoking upload access immediately blocks the next file write'
);
select throws_ok(
  $$insert into public.models (creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, published_at) values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c102', 'upload-revoked', 'Revoked model', 'Revoked model', '/logo.png', 'published', now())$$,
  '42501', 'new row violates row-level security policy for table "models"', 'revoking upload access blocks publishing metadata'
);
select throws_ok(
  $$insert into public.model_files (model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes) values ('00000000-0000-0000-0000-00000000c201', 'supabase', 'models', '00000000-0000-0000-0000-00000000c001/revoked.glb', 'revoked.glb', 'glb', 5)$$,
  '42501', 'new row violates row-level security policy for table "model_files"', 'revoking upload access blocks adding file metadata'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'models' and name like '00000000-0000-0000-0000-00000000c001/%'),
  2::bigint,
  'previously uploaded own source and preview files remain readable'
);
select lives_ok(
  $$delete from public.models where id = '00000000-0000-0000-0000-00000000c201'$$,
  'cleanup of own model metadata remains available after access is revoked'
);

reset role;
select * from finish();
rollback;
