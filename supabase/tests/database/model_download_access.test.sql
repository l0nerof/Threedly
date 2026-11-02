begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(64);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000d001', 'download-owner@example.test', '{"username":"download_owner"}'::jsonb),
  ('00000000-0000-0000-0000-00000000d002', 'download-creator@example.test', '{"username":"download_creator"}'::jsonb),
  ('00000000-0000-0000-0000-00000000d003', 'download-other@example.test', '{"username":"download_other"}'::jsonb),
  ('00000000-0000-0000-0000-00000000d004', 'download-max@example.test', '{"username":"download_max"}'::jsonb);

update public.profiles set downloads_limit_monthly = 1 where username = 'download_owner';
update public.profiles set can_upload = true where username = 'download_creator';
update public.profiles set downloads_limit_monthly = 2, downloads_used_this_month = 2 where username = 'download_other';
update public.profiles set plan_key = 'max', downloads_limit_monthly = 100 where username = 'download_max';

insert into public.category_groups (id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000d101', 'download-access', 'Download access', 'Download access');
insert into public.categories (id, group_id, slug, name_ua, name_en)
values ('00000000-0000-0000-0000-00000000d102', '00000000-0000-0000-0000-00000000d101', 'download-access', 'Download access', 'Download access');

insert into public.models (id, creator_id, category_id, slug, title_ua, title_en, cover_image_path, status, minimum_plan, published_at)
select
  ('00000000-0000-0000-0000-00000000d' || fixture.suffix)::uuid,
  '00000000-0000-0000-0000-00000000d002',
  '00000000-0000-0000-0000-00000000d102',
  'download-access-' || fixture.suffix, 'Download model', 'Download model', '/logo.png',
  fixture.status::public.model_status, fixture.minimum_plan::public.plan_key, now()
from (values
  ('201', 'published', 'free'), ('202', 'published', 'free'),
  ('203', 'published', 'pro'), ('204', 'published', 'max'),
  ('205', 'draft', 'free'), ('206', 'archived', 'free'),
  ('207', 'published', 'free'), ('208', 'published', 'free')
) as fixture(suffix, status, minimum_plan);

insert into public.model_files (id, model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes)
select
  ('00000000-0000-0000-0000-00000000d' || fixture.file_suffix)::uuid,
  ('00000000-0000-0000-0000-00000000d' || fixture.model_suffix)::uuid,
  'supabase', 'models',
  '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d' || fixture.model_suffix || '/' || fixture.file_name,
  fixture.file_name, split_part(fixture.file_name, '.', 2), 5
from (values
  ('301', '201', 'source.obj'), ('302', '201', 'alternate.fbx'),
  ('303', '202', 'source.obj'), ('304', '203', 'source.obj'),
  ('305', '204', 'source.obj'), ('306', '205', 'source.obj'),
  ('307', '206', 'source.obj'), ('308', '207', 'source.obj'),
  ('309', '208', 'source.obj')
) as fixture(file_suffix, model_suffix, file_name);

insert into storage.objects (bucket_id, name)
select bucket, object_path from public.model_files
where id between '00000000-0000-0000-0000-00000000d301' and '00000000-0000-0000-0000-00000000d309';

insert into public.model_files (id, model_id, storage_provider, bucket, object_path, file_name, format, file_size_bytes)
select
  ('00000000-0000-0000-0000-00000000d' || fixture.suffix)::uuid,
  '00000000-0000-0000-0000-00000000d201', fixture.provider::public.storage_provider,
  fixture.bucket, fixture.object_path, 'source.obj', 'obj', 5
from (values
  ('310', 'supabase', 'model-images', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/source.obj'),
  ('311', 'r2', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/source.obj'),
  ('312', 'supabase', 'models', '00000000-0000-0000-0000-00000000d001/00000000-0000-0000-0000-00000000d201/source.obj'),
  ('313', 'supabase', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/missing.obj'),
  ('314', 'supabase', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d202/source.obj'),
  ('315', 'supabase', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/../source.obj'),
  ('316', 'supabase', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/'),
  ('317', 'supabase', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/nested/source.obj'),
  ('318', 'supabase', 'models', '00000000-0000-0000-0000-00000000d002/00000000-0000-0000-0000-00000000d201/..')
) as fixture(suffix, provider, bucket, object_path);

select ok(not (select prosecdef from pg_proc where oid = 'public.record_model_download(uuid,uuid)'::regprocedure), 'the exposed RPC runs with caller permissions');
select ok((select prosecdef from pg_proc where oid = 'private.record_model_download(uuid,uuid)'::regprocedure), 'privileged writes stay in the private helper');
select ok(not has_schema_privilege('authenticated', 'private', 'create'), 'users cannot replace private helpers');

set local role anon;
-- Inspect ACLs to avoid the Supabase 17.6.1.106 permission-error crash: supabase/postgres#2112.
select ok(not has_function_privilege(current_user, 'public.record_model_download(uuid,uuid)', 'execute'), 'guests cannot call the download RPC');
select throws_ok($$select * from public.downloads$$, '42501', 'permission denied for table downloads', 'guests cannot read download history');
select ok(not has_function_privilege(current_user, (
  select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'record_model_download'
), 'execute'), 'guests cannot execute the private helper');

set local role authenticated;
set local request.jwt.claim.sub = '';
select is(public.record_model_download(null, null)::text, 'unauthorized', 'an authenticated role without a user is rejected');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000d099';
select is(public.record_model_download(null, null)::text, 'unauthorized', 'a user without a profile is rejected');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000d001';

select is(public.record_model_download(null, null)::text, 'model_unavailable', 'null model IDs are rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d299', null)::text, 'model_unavailable', 'missing models are rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d205', '00000000-0000-0000-0000-00000000d306')::text, 'model_unavailable', 'draft models cannot be downloaded');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d206', '00000000-0000-0000-0000-00000000d307')::text, 'model_unavailable', 'archived models cannot be downloaded');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d203', '00000000-0000-0000-0000-00000000d304')::text, 'plan_required', 'Free cannot download Pro models');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d204', '00000000-0000-0000-0000-00000000d305')::text, 'plan_required', 'Free cannot download Max models');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', null)::text, 'file_unavailable', 'null file IDs are rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d399')::text, 'file_unavailable', 'missing file metadata is rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d303')::text, 'file_unavailable', 'a file belonging to another model is rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d310')::text, 'file_unavailable', 'another bucket is rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d311')::text, 'file_unavailable', 'unsupported storage providers are rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d312')::text, 'file_unavailable', 'another creator folder is rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d313')::text, 'file_unavailable', 'a missing storage object is rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d314')::text, 'file_unavailable', 'another model folder is rejected even when its object exists');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d315')::text, 'file_unavailable', 'path traversal is rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d316')::text, 'file_unavailable', 'empty file path segments are rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d317')::text, 'file_unavailable', 'unexpected nested file paths are rejected');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d318')::text, 'file_unavailable', 'dot-dot file names are rejected');
select is((select count(*) from public.downloads), 0::bigint, 'rejected requests do not create history');
select is((select downloads_used_this_month from public.profiles where username = 'download_owner'), 0, 'rejected requests do not consume quota');
select is((select download_count from public.models where id = '00000000-0000-0000-0000-00000000d201'), 0, 'rejected requests do not increase popularity');

select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d301')::text, 'ok', 'Free can download an available Free model');
select is((select count(*) from public.downloads), 1::bigint, 'the first request records one download');
select is((select downloads_used_this_month from public.profiles where username = 'download_owner'), 1, 'the first request consumes one quota unit');
select is((select download_count from public.models where id = '00000000-0000-0000-0000-00000000d201'), 1, 'the first request increases popularity once');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d301')::text, 'ok', 'repeating the same download is allowed at the quota limit');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d302')::text, 'ok', 'another format of the same model does not require quota');
select is((select count(*) from public.downloads), 1::bigint, 'retries do not duplicate history');
select is((select downloads_used_this_month from public.profiles where username = 'download_owner'), 1, 'retries do not consume quota');
select is((select download_count from public.models where id = '00000000-0000-0000-0000-00000000d201'), 1, 'retries do not inflate popularity');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d313')::text, 'file_unavailable', 'repeat access does not bypass the current file availability check');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d202', '00000000-0000-0000-0000-00000000d303')::text, 'quota_exceeded', 'another model is denied at the quota limit');

select throws_ok($$insert into public.downloads (user_id, model_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d202')$$, '42501', 'permission denied for table downloads', 'users cannot forge download events');
select throws_ok($$update public.downloads set created_at = now() - interval '1 month'$$, '42501', 'permission denied for table downloads', 'users cannot move events outside the current month');
select throws_ok($$delete from public.downloads$$, '42501', 'permission denied for table downloads', 'users cannot reset quota by deleting history');
select throws_ok($$truncate public.downloads$$, '42501', 'permission denied for table downloads', 'users cannot truncate history');

reset role;
update public.models set status = 'archived' where id = '00000000-0000-0000-0000-00000000d201';
set local role authenticated;
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d301')::text, 'model_unavailable', 'a previously downloaded model still requires published status');
reset role;
update public.models set status = 'published' where id = '00000000-0000-0000-0000-00000000d201';
update public.profiles set plan_key = 'pro', downloads_limit_monthly = 25 where username = 'download_owner';
set local role authenticated;
select is(public.record_model_download('00000000-0000-0000-0000-00000000d203', '00000000-0000-0000-0000-00000000d304')::text, 'ok', 'a manually assigned Pro plan can download Pro models');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d204', '00000000-0000-0000-0000-00000000d305')::text, 'plan_required', 'Pro cannot download Max models');
reset role;
update public.profiles set plan_key = 'free', downloads_limit_monthly = 5 where username = 'download_owner';
set local role authenticated;
select is(public.record_model_download('00000000-0000-0000-0000-00000000d203', '00000000-0000-0000-0000-00000000d304')::text, 'plan_required', 'a repeat download still checks the current plan after downgrade');

reset role;
insert into public.downloads (user_id, model_id, created_at)
values
  ('00000000-0000-0000-0000-00000000d003', '00000000-0000-0000-0000-00000000d201', (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC') - interval '1 microsecond'),
  ('00000000-0000-0000-0000-00000000d003', '00000000-0000-0000-0000-00000000d202', (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC');
set local timezone = 'Pacific/Kiritimati';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000d003';
select is((select count(*) from public.downloads where user_id = '00000000-0000-0000-0000-00000000d001'), 0::bigint, 'RLS hides another user history');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d301')::text, 'ok', 'the same model from a previous UTC month requires a new charge');
select is((select downloads_used_this_month from public.profiles where username = 'download_other'), 1, 'the new UTC month ignores stale usage and history outside its boundaries');

reset role;
update public.profiles set downloads_used_this_month = 0, downloads_limit_monthly = 0 where username = 'download_other';
set local role authenticated;
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d301')::text, 'ok', 'a repeat remains free when the monthly limit is reduced to zero');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d202', '00000000-0000-0000-0000-00000000d303')::text, 'quota_exceeded', 'a zero limit blocks new models despite a manually cleared usage cache');

reset role;
update public.profiles set downloads_limit_monthly = 5 where username = 'download_other';
create function pg_temp.reject_download_counter_update()
returns trigger language plpgsql as $$
begin
  raise exception 'download counter unavailable';
end;
$$;
create trigger reject_download_counter_update
before update on public.models
for each row when (old.id = '00000000-0000-0000-0000-00000000d202'::uuid)
execute function pg_temp.reject_download_counter_update();
set local role authenticated;
select throws_ok(
  $$select public.record_model_download('00000000-0000-0000-0000-00000000d202', '00000000-0000-0000-0000-00000000d303')$$,
  'P0001', 'download counter unavailable', 'a final write failure aborts the entire download transaction'
);
select is((select count(*) from public.downloads), 3::bigint, 'a write failure rolls back the inserted event');
select is((select downloads_used_this_month from public.profiles where username = 'download_other'), 0, 'a write failure rolls back the quota update');
select is((select download_count from public.models where id = '00000000-0000-0000-0000-00000000d202'), 0, 'a write failure leaves popularity unchanged');
reset role;
drop trigger reject_download_counter_update on public.models;

insert into public.downloads (user_id, model_id, created_at)
values
  ('00000000-0000-0000-0000-00000000d004', '00000000-0000-0000-0000-00000000d201', date_trunc('month', now() at time zone 'UTC') at time zone 'UTC'),
  ('00000000-0000-0000-0000-00000000d004', '00000000-0000-0000-0000-00000000d201', date_trunc('month', now() at time zone 'UTC') at time zone 'UTC'),
  ('00000000-0000-0000-0000-00000000d004', '00000000-0000-0000-0000-00000000d202', ((date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC') - interval '1 microsecond');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000d004';
select is(public.record_model_download('00000000-0000-0000-0000-00000000d203', '00000000-0000-0000-0000-00000000d304')::text, 'ok', 'Max includes Pro access');
select is((select downloads_used_this_month from public.profiles where username = 'download_max'), 3, 'UTC month endpoints count and duplicate legacy events charge only once per model');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d204', '00000000-0000-0000-0000-00000000d305')::text, 'ok', 'Max can download Max models');

reset role;
update public.profiles set downloads_limit_monthly = 2, downloads_used_this_month = 0 where username = 'download_creator';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000d002';
select is(public.record_model_download('00000000-0000-0000-0000-00000000d207', '00000000-0000-0000-0000-00000000d308')::text, 'ok', 'first deletion fixture consumes quota');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d208', '00000000-0000-0000-0000-00000000d309')::text, 'ok', 'second deletion fixture consumes quota');
delete from public.models where id in ('00000000-0000-0000-0000-00000000d207', '00000000-0000-0000-0000-00000000d208');
select is((select count(*) from public.downloads where model_id is null), 2::bigint, 'deleting models preserves each charged history event');
select is(public.record_model_download('00000000-0000-0000-0000-00000000d201', '00000000-0000-0000-0000-00000000d301')::text, 'quota_exceeded', 'deleting downloaded models cannot restore quota');

reset role;
select * from finish();
rollback;
