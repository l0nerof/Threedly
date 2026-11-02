begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a901', 'management-owner@example.test', '{"username":"management_owner"}'),
  ('00000000-0000-0000-0000-00000000a902', 'management-other@example.test', '{"username":"management_other"}');
update public.profiles set can_upload = true where id = '00000000-0000-0000-0000-00000000a901';
insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000a911', 'management', 'Management', 'Management');
insert into public.categories (id, group_id, slug, name_ua, name_en) values
  ('00000000-0000-0000-0000-00000000a912', '00000000-0000-0000-0000-00000000a911', 'management-a', 'A', 'A'),
  ('00000000-0000-0000-0000-00000000a913', '00000000-0000-0000-0000-00000000a911', 'management-b', 'B', 'B');
insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, status, cover_image_path, preview_model_path, published_at, download_count, is_featured)
select
  ('00000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid,
  '00000000-0000-0000-0000-00000000a901', '00000000-0000-0000-0000-00000000a912',
  'management-' || n, 'Назва моделі', 'Model title',
  case when n = 43301 then 'draft'::public.model_status else 'published'::public.model_status end,
  '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0') || '/cover.webp',
  case when n = 43297 then '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/preview.glb' end,
  case when n = 43301 then null else '2026-01-01T00:00:00Z'::timestamptz end,
  7, true
from generate_series(43297, 43301) n;
update public.models set creator_id = '00000000-0000-0000-0000-00000000a902'
where id = '00000000-0000-0000-0000-00000000a922';
update public.models set cover_image_path = '00000000-0000-0000-0000-00000000a902/foreign.webp'
where id = '00000000-0000-0000-0000-00000000a924';
insert into public.model_files (id, model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes, is_primary) values
  ('00000000-0000-0000-0000-00000000a931', '00000000-0000-0000-0000-00000000a921', 'supabase', 'models', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/source.obj', 'source.obj', 'obj', 5, true),
  ('00000000-0000-0000-0000-00000000a932', '00000000-0000-0000-0000-00000000a925', 'supabase', 'models', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a925/source.obj', 'source.obj', 'obj', 5, true);
insert into storage.objects (bucket_id, name) values
  ('models', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/source.obj'),
  ('models', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/preview.glb'),
  ('model-images', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/cover.webp'),
  ('models', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a925/source.obj'),
  ('models', '00000000-0000-0000-0000-00000000a902/foreign.obj');
insert into storage.objects (bucket_id, name)
select 'models', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a923/' || lpad(n::text, 3, '0') || '.obj'
from generate_series(1, 201) n;
insert into public.favorites (user_id, model_id) values ('00000000-0000-0000-0000-00000000a902', '00000000-0000-0000-0000-00000000a921');
insert into public.downloads (user_id, model_id, created_at) values ('00000000-0000-0000-0000-00000000a902', '00000000-0000-0000-0000-00000000a921', now());

select ok(not has_function_privilege('anon', 'public.manage_owned_model(uuid,text,jsonb)', 'EXECUTE'), 'guest RPC denied without executing a forbidden function');
select ok(not has_function_privilege('anon', 'private.manage_owned_model(uuid,text,jsonb)', 'EXECUTE'), 'guest helper denied');
select ok(has_function_privilege('authenticated', 'public.manage_owned_model(uuid,text,jsonb)', 'EXECUTE'), 'authenticated wrapper allowed');
select ok(not (select prosecdef from pg_proc where oid = 'public.manage_owned_model(uuid,text,jsonb)'::regprocedure), 'public wrapper is security invoker');
select ok((select prosecdef from pg_proc where oid = 'private.manage_owned_model(uuid,text,jsonb)'::regprocedure), 'privileged worker is private');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'private.manage_owned_model(uuid,text,jsonb)'::regprocedure), 'helper pins empty search path');
select ok(not has_any_column_privilege('authenticated', 'public.models', 'UPDATE'), 'direct model updates cannot change service fields or clear deletion');
select ok(not has_table_privilege('anon', 'public.models', 'TRUNCATE'), 'guest cannot truncate models');
select ok(not has_table_privilege('authenticated', 'public.model_files', 'TRUNCATE'), 'authenticated cannot truncate files');

set local role authenticated;
set local request.jwt.claim.sub = '';
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'archive')), 'unauthorized', 'role alone is not an identity');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000a901';
set local management.metadata = '{"titleUa":"  Нова назва  ","titleEn":"  New title  ","descriptionUa":"  Опис  ","descriptionEn":" ","categoryId":"00000000-0000-0000-0000-00000000a913","minimumPlan":"max"}';
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a922', 'archive')), 'model_unavailable', 'foreign published model cannot be archived');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a999', 'archive')), 'model_unavailable', 'missing and foreign models are indistinguishable');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a922', 'begin_delete')), 'model_unavailable', 'foreign deletion rejected before file disclosure');
select is((select model_paths from public.manage_owned_model('00000000-0000-0000-0000-00000000a922', 'begin_delete')), '[]'::jsonb, 'foreign paths are not returned');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'unsupported')), 'invalid_request', 'unknown operation rejected');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'archive', '{}'::jsonb)), 'invalid_request', 'non-update metadata rejected');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', current_setting('management.metadata')::jsonb)), 'ok', 'valid metadata saved');
select is((select title_ua from public.models where id = '00000000-0000-0000-0000-00000000a921'), 'Нова назва', 'title trimmed');
select is((select description_ua from public.models where id = '00000000-0000-0000-0000-00000000a921'), 'Опис', 'description trimmed');
select ok((select description_en is null from public.models where id = '00000000-0000-0000-0000-00000000a921'), 'empty description normalized');
select is((select minimum_plan::text from public.models where id = '00000000-0000-0000-0000-00000000a921'), 'max', 'minimum plan saved');
select is((select category_id::text from public.models where id = '00000000-0000-0000-0000-00000000a921'), '00000000-0000-0000-0000-00000000a913', 'category saved');
select ok((select download_count = 7 and is_featured and slug = 'management-43297' and published_at = '2026-01-01T00:00:00Z' from public.models where id = '00000000-0000-0000-0000-00000000a921'), 'metadata editing preserves service fields and URL');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', current_setting('management.metadata')::jsonb || '{"download_count":99}')), 'invalid_request', 'extra service field rejected');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', jsonb_set(current_setting('management.metadata')::jsonb, '{titleUa}', 'null'))), 'invalid_request', 'null title rejected');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', jsonb_set(current_setting('management.metadata')::jsonb, '{descriptionEn}', '15'))), 'invalid_request', 'non-string description rejected');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', jsonb_set(current_setting('management.metadata')::jsonb, '{categoryId}', '"invalid"'))), 'invalid_request', 'unknown category rejected without unsafe UUID cast');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'archive')), 'ok', 'own model archived');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'archive')), 'ok', 'archive repeat safe');
set local role anon;
select is((select count(*) from public.models where id = '00000000-0000-0000-0000-00000000a921'), 0::bigint, 'archived model hidden from public');
set local role authenticated;
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'publish')), 'ok', 'assets and permission permit republishing');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'publish')), 'ok', 'publish repeat safe');
select is((select published_at from public.models where id = '00000000-0000-0000-0000-00000000a921'), '2026-01-01T00:00:00Z'::timestamptz, 'republishing preserves first publication time');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a925', 'publish')), 'file_unavailable', 'missing cover prevents publication');
insert into storage.objects (bucket_id, name) values ('model-images', '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a925/cover.webp');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a925', 'publish')), 'ok', 'ready draft can publish');
select ok((select published_at is not null from public.models where id = '00000000-0000-0000-0000-00000000a925'), 'first publication gets timestamp');

reset role;
update public.profiles set can_upload = false where id = '00000000-0000-0000-0000-00000000a901';
set local role authenticated;
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', current_setting('management.metadata')::jsonb)), 'ok', 'revoked creator can edit existing metadata');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'archive')), 'ok', 'revoked creator can archive');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'publish')), 'upload_not_allowed', 'republishing requires live permission');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'finish_delete')), 'invalid_request', 'cannot finish deletion before beginning');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'begin_delete')), 'ok', 'revoked creator can start cleanup');
select ok((select deletion_pending and status = 'archived' from public.models where id = '00000000-0000-0000-0000-00000000a921'), 'deletion intent persists before Storage writes');
select is((select jsonb_array_length(model_paths) from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'begin_delete')), 2, 'retry discovers remaining source and preview');
select is((select jsonb_array_length(image_paths) from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'begin_delete')), 1, 'cleanup includes cover');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'update', current_setting('management.metadata')::jsonb)), 'deletion_pending', 'pending deletion cannot be edited');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'publish')), 'deletion_pending', 'pending deletion cannot be republished');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'finish_delete')), 'cleanup_incomplete', 'database row retained while files remain');
reset role;
update public.profiles set can_upload = true where id = '00000000-0000-0000-0000-00000000a901';
set local role authenticated;
select throws_ok($$insert into storage.objects(bucket_id,name) values ('models','00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/new.obj')$$, '42501', 'new row violates row-level security policy for table "objects"', 'pending folder rejects new source uploads');
select throws_ok($$insert into storage.objects(bucket_id,name) values ('model-images','00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/new.webp')$$, '42501', 'new row violates row-level security policy for table "objects"', 'pending folder rejects new cover uploads');
select throws_ok($$insert into public.model_files(model_id,storage_provider,bucket,object_path,file_name,format,file_size_bytes) values ('00000000-0000-0000-0000-00000000a921','supabase','models','new.obj','new.obj','obj',5)$$, '42501', 'new row violates row-level security policy for table "model_files"', 'pending model rejects new file metadata');

-- Rollback-only metadata fixtures; application deletion uses the Storage API, never SQL.
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id = 'models' and name = '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/source.obj';
select is((select jsonb_array_length(model_paths) from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'begin_delete')), 1, 'retry skips already removed objects');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'finish_delete')), 'cleanup_incomplete', 'partial cleanup cannot lose metadata');
delete from storage.objects where name like '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a921/%';
set local storage.allow_delete_query = 'false';
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'finish_delete')), 'ok', 'empty folder permits final deletion');
select is((select count(*) from public.models where id = '00000000-0000-0000-0000-00000000a921'), 0::bigint, 'model removed');
select is((select count(*) from public.model_files where model_id = '00000000-0000-0000-0000-00000000a921'), 0::bigint, 'source metadata cascades');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a921', 'finish_delete')), 'model_unavailable', 'completed deletion repeat has no writes');
select is((select jsonb_array_length(model_paths) from public.manage_owned_model('00000000-0000-0000-0000-00000000a923', 'begin_delete')), 100, 'cleanup batch bounded to 100');
select is((select model_paths->>0 from public.manage_owned_model('00000000-0000-0000-0000-00000000a923', 'begin_delete')), '00000000-0000-0000-0000-00000000a901/00000000-0000-0000-0000-00000000a923/001.obj', 'batch order deterministic');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a923', 'finish_delete')), 'cleanup_incomplete', 'batch bound never silently treats remaining objects as cleaned');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a924', 'begin_delete')), 'storage_unavailable', 'foreign asset paths rejected');
select ok((select deletion_pending from public.models where id = '00000000-0000-0000-0000-00000000a924'), 'unsafe asset metadata stays hidden for manual repair');
select is((select result from public.manage_owned_model('00000000-0000-0000-0000-00000000a924', 'finish_delete')), 'storage_unavailable', 'unsafe metadata cannot bypass cleanup validation');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000a902';
select is((select count(*) from public.favorites where model_id = '00000000-0000-0000-0000-00000000a921'), 0::bigint, 'deleted model removed from favorites');
select is((select count(*) from public.downloads where user_id = auth.uid() and model_id is null), 1::bigint, 'charged history preserved with null model');
select is((select downloads_used_this_month from public.get_profile_overview()), 1::bigint, 'deletion does not refund monthly quota');
reset role;
select is((select count(*) from storage.objects where name = '00000000-0000-0000-0000-00000000a902/foreign.obj'), 1::bigint, 'foreign storage object untouched');
select is((select download_count from public.models where id = '00000000-0000-0000-0000-00000000a922'), 7, 'foreign popularity unchanged');
select * from finish();
rollback;
