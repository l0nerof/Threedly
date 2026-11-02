begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000f001','publication-files-owner@example.test','{"username":"pub_files_owner"}'),
 ('00000000-0000-0000-0000-00000000f002','publication-files-other@example.test','{"username":"pub_files_other"}');
update public.profiles set can_upload = true where id = '00000000-0000-0000-0000-00000000f001';
insert into public.category_groups(id,slug,name_ua,name_en) values
 ('00000000-0000-0000-0000-00000000f101','publication-files','Files','Files');
insert into public.categories(id,group_id,slug,name_ua,name_en) values
 ('00000000-0000-0000-0000-00000000f102','00000000-0000-0000-0000-00000000f101','publication-files','Files','Files');
create temporary table publication_results(label text primary key, data jsonb not null);
grant select,insert,update on publication_results to authenticated;
create function pg_temp.publication_run(operation text, payload jsonb default null)
returns jsonb language sql as $$
 with response as (
   select * from public.manage_publication_draft('00000000-0000-0000-0000-00000000f201',operation,
     case when operation = 'create' then null else (
       select revision from public.model_publication_drafts where id = '00000000-0000-0000-0000-00000000f201') end,payload)
 ), saved as (
   insert into publication_results values(operation,(select to_jsonb(r) from response r))
   on conflict(label) do update set data = excluded.data returning data
 ) select data from saved;
$$;

select ok(not (select public from storage.buckets where id='model-draft-files'), 'draft source bucket is private');
select ok(not (select public from storage.buckets where id='model-draft-images'), 'draft covers are private');
select is((select file_size_limit from storage.buckets where id='model-draft-files'),52428800::bigint,'source limit is 50 MiB');
select is((select file_size_limit from storage.buckets where id='model-draft-images'),5242880::bigint,'cover limit is 5 MiB');
select ok(not has_function_privilege('anon','public.manage_publication_draft(uuid,text,integer,jsonb)','execute'),'guests cannot execute the wrapper');
select ok(not has_function_privilege('anon','private.manage_publication_draft(uuid,text,integer,jsonb)','execute'),'guests cannot execute the worker');
select ok(not (select prosecdef from pg_proc where oid='public.manage_publication_draft(uuid,text,integer,jsonb)'::regprocedure),'public wrapper is invoker');
select ok((select prosecdef and proconfig = array['search_path=""'] from pg_proc where oid='private.manage_publication_draft(uuid,text,integer,jsonb)'::regprocedure),'private worker pins its search path');
select ok(not has_any_column_privilege('authenticated','public.model_publication_assets','insert')
  and not has_any_column_privilege('authenticated','public.model_publication_assets','update')
  and not has_table_privilege('authenticated','public.model_publication_assets','delete'),'asset records cannot be forged directly');
select ok(not has_column_privilege('authenticated','public.model_publication_drafts','revision','update')
  and not has_column_privilege('authenticated','public.model_publication_drafts','lifecycle','update')
  and not has_column_privilege('authenticated','public.model_publication_drafts','source_asset_id','update'),'service fields are protected');
select ok(not has_table_privilege('authenticated','private.model_publication_destinations','select')
  and not has_table_privilege('authenticated','private.model_publication_destinations','update'),'destination tombstones are not a public API');
select ok(has_schema_privilege('service_role','private','usage'),'administrative draft cleanup can reach the guarded private ledger');
select is(private.publication_file_name('.obj','obj'),'obj.obj','dot-prefixed filenames match the existing TypeScript sanitizer');
select ok((select prosecdef and proconfig=array['search_path=""'] from pg_proc
  where oid='private.guard_publication_storage_insert()'::regprocedure),'the final Storage guard is private and pins its search path');
select ok(not has_function_privilege('authenticated','private.guard_publication_storage_insert()','execute')
  and not has_function_privilege('service_role','private.guard_publication_storage_insert()','execute'),'application roles cannot directly call the trigger guard');
select ok(not has_function_privilege('authenticated','private.publication_object_allowed(uuid,text,text,text)','execute'),
  'the internal actor-aware checker cannot be invoked directly by users');

set local role authenticated;
set local request.jwt.claim.sub = '';
select is(pg_temp.publication_run('create')->>'result','unauthorized','role alone is not an identity');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f002';
select is(pg_temp.publication_run('create')->>'result','upload_not_allowed','creator access is required');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f001';
select is(pg_temp.publication_run('create')->>'result','ok','creator starts an empty draft');
select is(pg_temp.publication_run('create')->>'revision','0','retrying create retains the same draft');
select is((select count(*) from public.model_publication_drafts),1::bigint,'create is idempotent');
select is(pg_temp.publication_run('prepare_publish')->>'result','not_ready','empty draft cannot publish');
select is(pg_temp.publication_run('save','{"titleUa":"","titleEn":"A","descriptionUa":null,"descriptionEn":"","categoryId":null,"minimumPlan":"free"}')->>'result','ok','partial metadata saves explicitly');
select is((select result from public.manage_publication_draft('00000000-0000-0000-0000-00000000f201','save',0,
 '{"titleUa":"stale","titleEn":"","descriptionUa":null,"descriptionEn":null,"categoryId":null,"minimumPlan":"free"}')),'conflict','stale tabs cannot overwrite saved metadata');
select is(pg_temp.publication_run('save','{"titleUa":"Модель","titleEn":"Model","descriptionUa":null,"descriptionEn":null,"categoryId":"00000000-0000-0000-0000-00000000f102","minimumPlan":"free","creatorId":"forged"}')->>'result','invalid_request','extra metadata fields are rejected');
select is(pg_temp.publication_run('save','{"titleUa":"Модель","titleEn":"Model","descriptionUa":null,"descriptionEn":null,"categoryId":"00000000-0000-0000-0000-00000000f102","minimumPlan":"free"}')->>'result','ok','complete bilingual metadata saves');
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"source.obj","extension":"obj","mimeType":"application/octet-stream","size":999999999999999999999999999999}')->>'result','invalid_request','huge numeric payload does not overflow a cast');
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"source.exe","extension":"obj","mimeType":"application/octet-stream","size":5}')->>'result','invalid_request','source extension must match its name');
select is(pg_temp.publication_run('reserve','{"kind":"cover","name":"cover.png","extension":"png","mimeType":"image/png","size":5242881}')->>'result','invalid_request','oversized cover is rejected');
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"Café Sofa.OBJ","extension":"obj","mimeType":"application/octet-stream","size":5}')->>'result','ok','valid source receives an immutable reservation');
insert into publication_results select 'old_source', data->'assets'->0 from publication_results where label='reserve';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='old_source')))->>'result','file_unavailable','attachment requires completed Storage metadata');
insert into storage.objects(bucket_id,name,metadata)
 select data->>'bucket',data->>'path',jsonb_build_object('size',5,'mimetype','application/octet-stream')
 from publication_results where label='old_source';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='old_source')))->>'result','ok','uploaded source attaches');
select is((select count(*) from public.model_publication_assets where state='active'),1::bigint,'one source is active');
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"New Sofa.obj","extension":"obj","mimeType":"application/octet-stream","size":6}')->>'result','ok','replacement gets a different reservation');
insert into publication_results select 'source', data->'assets'->0 from publication_results where label='reserve';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='source')))->>'result','file_unavailable','failed replacement retains the old source');
select is((select source_asset_id::text from public.model_publication_drafts),(select data->>'id' from publication_results where label='old_source'),'old source remains selected');
insert into storage.objects(bucket_id,name,metadata)
 select data->>'bucket',data->>'path',jsonb_build_object('size',6,'mimetype','application/octet-stream')
 from publication_results where label='source';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='source')))->>'result','ok','completed replacement attaches');
select is((select state::text from public.model_publication_assets where id::text=(select data->>'id' from publication_results where label='old_source')),'retired','old source retires only after replacement');
select is(pg_temp.publication_run('release',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='source')))->>'result','invalid_request','active source cannot be released');
select is(pg_temp.publication_run('reserve','{"kind":"cover","name":"cover.png","extension":"png","mimeType":"image/png","size":7}')->>'result','ok','one cover is reserved');
insert into publication_results select 'cover', data->'assets'->0 from publication_results where label='reserve';
insert into storage.objects(bucket_id,name,metadata)
 select data->>'bucket',data->>'path',jsonb_build_object('size',7,'mimetype','image/png')
 from publication_results where label='cover';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='cover')))->>'result','ok','cover attaches');
select is((select count(*) from public.model_publication_assets where state='active'),2::bigint,'one active asset per kind');
select throws_ok($$insert into storage.objects(bucket_id,name) values('model-draft-files','00000000-0000-0000-0000-00000000f001/00000000-0000-0000-0000-00000000f201/unreserved.obj')$$,
 '42501','Publication file destination is closed or invalid','unreserved paths cannot be uploaded');
set local storage.allow_delete_query = 'true';
with removed as (delete from storage.objects where name=(select data->>'path' from publication_results where label='source') returning id)
select is((select count(*) from removed),0::bigint,'RLS prevents active-source removal');
set local storage.allow_delete_query = 'false';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f002';
select is((select count(*) from public.model_publication_assets),0::bigint,'other creators cannot read private asset records');
select is((select count(*) from storage.objects where name=(select data->>'path' from publication_results where label='cover')),0::bigint,'private covers cannot be read by another creator');
select is((select result from public.manage_publication_draft('00000000-0000-0000-0000-00000000f201','cleanup')),'draft_unavailable','foreign cleanup does not disclose paths');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f001';
select is(pg_temp.publication_run('prepare_publish')->>'result','ok','complete draft freezes for publication');
insert into publication_results select 'prepared',data from publication_results where label='prepare_publish';
select is(pg_temp.publication_run('prepare_publish')->>'model_id',(select data->>'model_id' from publication_results where label='prepared'),'retry uses the same publication ID');
select is((select jsonb_array_length(data->'assets') from publication_results where label='prepared'),2,'publication returns two canonical destinations');
select is((select data->'assets'->0->>'destinationPath' from publication_results where label='prepared'),
 '00000000-0000-0000-0000-00000000f001/'||(select data->>'model_id' from publication_results where label='prepared')||'/new-sofa.obj','source destination matches the existing download contract');
select is(pg_temp.publication_run('save','{"titleUa":"Changed","titleEn":"Changed","descriptionUa":null,"descriptionEn":null,"categoryId":null,"minimumPlan":"free"}')->>'result','busy','frozen content cannot be edited');
with changed as (update public.model_publication_drafts set title_en='Bypass' returning id)
select is((select count(*) from changed),0::bigint,'direct metadata updates also respect the frozen state');
select is(pg_temp.publication_run('finish_publish')->>'result','file_unavailable','publication cannot finish without copied files');
select is((select count(*) from public.models where id::text=(select data->>'model_id' from publication_results where label='prepared')),0::bigint,'failed finalization creates no model');
select throws_ok($$insert into storage.objects(bucket_id,name) select 'models','00000000-0000-0000-0000-00000000f001/'||(data->>'model_id')||'/wrong.obj' from publication_results where label='prepared'$$,
 '42501',null,'frozen destination rejects arbitrary files');
insert into storage.objects(bucket_id,name,metadata)
 select a->>'destinationBucket',a->>'destinationPath',jsonb_build_object('size',a->'size','mimetype',a->>'mimeType')
 from publication_results r cross join lateral jsonb_array_elements(r.data->'assets') a where r.label='prepared';
set local storage.allow_delete_query = 'true';
with removed as (delete from storage.objects where name like '00000000-0000-0000-0000-00000000f001/'||(select data->>'model_id' from publication_results where label='prepared')||'/%' returning id)
select is((select count(*) from removed),0::bigint,'candidate files cannot disappear during publication');
set local storage.allow_delete_query = 'false';
select is(pg_temp.publication_run('finish_publish')->>'result','ok','model and primary file commit together');
select is(pg_temp.publication_run('finish_publish')->>'model_id',(select data->>'model_id' from publication_results where label='prepared'),'finalization retry returns the same model');
select is(pg_temp.publication_run('prepare_publish')->>'lifecycle','published','lost final response can be reconciled');
select is((select count(*) from public.models where id::text=(select data->>'model_id' from publication_results where label='prepared')),1::bigint,'retries create exactly one model');
select is((select count(*) from public.model_files where model_id::text=(select data->>'model_id' from publication_results where label='prepared')),1::bigint,'retries create exactly one primary file');
select is(pg_temp.publication_run('begin_delete')->>'result','already_published','published models use existing model management, not draft deletion');
select is(pg_temp.publication_run('cleanup')->>'result','ok','private originals become cleanup candidates');
select is((select jsonb_array_length(data->'objects') from publication_results where label='cleanup'),3,'cleanup includes retired and published private originals only');
select is(pg_temp.publication_run('finish_cleanup')->>'result','cleanup_incomplete','cleanup cannot lose files on a partial failure');
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id in('model-draft-files','model-draft-images')
 and name like '00000000-0000-0000-0000-00000000f001/00000000-0000-0000-0000-00000000f201/%';
set local storage.allow_delete_query = 'false';
select is(pg_temp.publication_run('finish_cleanup')->>'result','ok','cleanup finalizes after Storage removal');
select is((select count(*) from public.model_publication_assets),0::bigint,'cleaned private records are removed');
reset role;
select is((select count(*) from storage.objects where name like '00000000-0000-0000-0000-00000000f001/'||(select data->>'model_id' from publication_results where label='prepared')||'/%'),2::bigint,'published destination objects survive private cleanup');

delete from public.model_publication_drafts where id='00000000-0000-0000-0000-00000000f201';
set local role authenticated;
select is(pg_temp.publication_run('create')->>'result','ok','another unfinished draft can be created');
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"source.obj","extension":"obj","mimeType":"application/octet-stream","size":5}')->>'result','ok','in-flight upload has a durable reservation');
insert into publication_results select 'in_flight',data->'assets'->0 from publication_results where label='reserve';
reset role;
update public.profiles set can_upload=false where id='00000000-0000-0000-0000-00000000f001';
set local role authenticated;
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"next.obj","extension":"obj","mimeType":"application/octet-stream","size":5}')->>'result','upload_not_allowed','revocation blocks new reservations');
select is(pg_temp.publication_run('begin_delete')->>'result','ok','revoked creator may still delete an existing draft');
select is(pg_temp.publication_run('cleanup')->>'result','ok','cleanup survives permission revocation');
select is(pg_temp.publication_run('finish_cleanup')->>'result','cleanup_incomplete','unexpired reservation remains as a tombstone for late uploads');
select throws_ok($$insert into storage.objects(bucket_id,name) select data->>'bucket',data->>'path' from publication_results where label='in_flight'$$,
 '42501','Publication file destination is closed or invalid','deletion blocks a new upload at the old reservation');
reset role;
set local request.jwt.claim.sub = '';
select throws_ok($$insert into storage.objects(bucket_id,name,owner_id)
 select data->>'bucket',data->>'path','00000000-0000-0000-0000-00000000f001' from publication_results where label='in_flight'$$,
 '42501','Publication file destination is closed or invalid','a privileged final insert cannot bypass private upload cancellation');
reset role;
update public.model_publication_assets set upload_expires_at=now()-interval '1 second'
 where draft_id='00000000-0000-0000-0000-00000000f201';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000f001';
select is(pg_temp.publication_run('finish_cleanup')->>'result','ok','expired empty reservation can be finalized');
select is((select count(*) from public.model_publication_drafts),0::bigint,'draft deletion completes without orphaning a pending row');
reset role;
update public.profiles set can_upload=true where id='00000000-0000-0000-0000-00000000f001';
set local role authenticated;
select is(pg_temp.publication_run('create')->>'result','ok','creator starts a cancellation scenario');
select is(pg_temp.publication_run('save','{"titleUa":"Модель","titleEn":"Model","descriptionUa":null,"descriptionEn":null,"categoryId":"00000000-0000-0000-0000-00000000f102","minimumPlan":"free"}')->>'result','ok','cancellation fixture has complete metadata');
select is(pg_temp.publication_run('reserve','{"kind":"source","name":"Café Sofa.OBJ","extension":"obj","mimeType":"application/octet-stream","size":5}')->>'result','ok','source with an accented name is reserved');
insert into publication_results select 'cancel_source',data->'assets'->0 from publication_results where label='reserve';
insert into storage.objects(bucket_id,name,metadata) select data->>'bucket',data->>'path',
 jsonb_build_object('size',5,'mimetype','application/octet-stream') from publication_results where label='cancel_source';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='cancel_source')))->>'result','ok','cancellation source attaches');
select is(pg_temp.publication_run('reserve','{"kind":"cover","name":"cover.png","extension":"png","mimeType":"image/png","size":7}')->>'result','ok','cancellation cover is reserved');
insert into publication_results select 'cancel_cover',data->'assets'->0 from publication_results where label='reserve';
insert into storage.objects(bucket_id,name,metadata) select data->>'bucket',data->>'path',
 jsonb_build_object('size',7,'mimetype','image/png') from publication_results where label='cancel_cover';
select is(pg_temp.publication_run('attach',jsonb_build_object('assetId',(select data->>'id' from publication_results where label='cancel_cover')))->>'result','ok','cancellation cover attaches');
select is(pg_temp.publication_run('prepare_publish')->>'result','ok','cancellation publication freezes');
insert into publication_results select 'cancel_prepared',data from publication_results where label='prepare_publish';
select is((select data->'assets'->0->>'destinationPath' from publication_results where label='cancel_prepared'),
 '00000000-0000-0000-0000-00000000f001/'||(select data->>'model_id' from publication_results where label='cancel_prepared')||'/cafe-sofa.obj','SQL filename normalization matches the TypeScript canonical format');
insert into storage.objects(bucket_id,name,metadata)
 select a->>'destinationBucket',a->>'destinationPath',jsonb_build_object('size',a->'size','mimetype',a->>'mimeType')
 from publication_results r cross join lateral jsonb_array_elements(r.data->'assets') a where r.label='cancel_prepared';
reset role;
select throws_ok($$delete from public.profiles where id='00000000-0000-0000-0000-00000000f001'$$,
 '23503',null,'profile cascade cannot orphan private draft bytes');
update public.profiles set can_upload=false where id='00000000-0000-0000-0000-00000000f001';
set local role authenticated;
select is(pg_temp.publication_run('cancel_publish')->>'result','ok','revocation does not prevent cancellation');
select is(pg_temp.publication_run('finish_publish')->>'result','busy','cancelled publication cannot finalize');
select is(pg_temp.publication_run('cleanup')->>'result','ok','cancellation exposes candidate destinations for cleanup');
select is((select jsonb_array_length(data->'objects') from publication_results where label='cleanup'),2,'active private originals are retained during cancellation');
select is(pg_temp.publication_run('finish_cleanup')->>'result','cleanup_incomplete','cancellation preserves state while candidate bytes remain');
set local storage.allow_delete_query = 'true';
delete from storage.objects where name like '00000000-0000-0000-0000-00000000f001/'||(select data->>'model_id' from publication_results where label='cancel_prepared')||'/%';
set local storage.allow_delete_query = 'false';
select is(pg_temp.publication_run('finish_cleanup')->>'lifecycle','draft','clean cancellation restores an editable draft without a timer');
select is((select count(*) from public.model_publication_assets where state='active'),2::bigint,'cancellation retains both selected private assets');
reset role;
update public.profiles set can_upload=true where id='00000000-0000-0000-0000-00000000f001';
set local role authenticated;
select throws_ok($$insert into storage.objects(bucket_id,name,metadata)
 select a->>'destinationBucket',a->>'destinationPath',jsonb_build_object('size',a->'size','mimetype',a->>'mimeType')
 from publication_results r cross join lateral jsonb_array_elements(r.data->'assets') a where r.label='cancel_prepared'$$,
 '42501',null,'closed publication destinations reject late copies after the draft is editable again');
select is(pg_temp.publication_run('prepare_publish')->>'result','ok','creator can begin a new explicit publication after cancellation');
select isnt((select data->>'model_id' from publication_results where label='prepare_publish'),
 (select data->>'model_id' from publication_results where label='cancel_prepared'),'explicit new attempt receives a new ID while the old ID stays closed');
select is(pg_temp.publication_run('begin_delete')->>'result','ok','unpublished frozen draft can be deleted');
select is(pg_temp.publication_run('cleanup')->>'result','ok','deletion returns private and candidate paths');
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id in('model-draft-files','model-draft-images')
 and name like '00000000-0000-0000-0000-00000000f001/00000000-0000-0000-0000-00000000f201/%';
set local storage.allow_delete_query = 'false';
select is(pg_temp.publication_run('finish_cleanup')->>'result','ok','empty frozen draft deletion finalizes');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata)
 select a->>'destinationBucket',a->>'destinationPath',jsonb_build_object('size',a->'size','mimetype',a->>'mimeType')
 from publication_results r cross join lateral jsonb_array_elements(r.data->'assets') a where r.label='prepare_publish'$$,
 '42501',null,'destination tombstones survive draft deletion and reject late copies');
reset role;
set local request.jwt.claim.sub = '';
select throws_ok($$insert into storage.objects(bucket_id,name,metadata,owner_id)
 select a->>'destinationBucket',a->>'destinationPath',jsonb_build_object('size',a->'size','mimetype',a->>'mimeType'),
 '00000000-0000-0000-0000-00000000f001'
 from publication_results r cross join lateral jsonb_array_elements(r.data->'assets') a where r.label='prepare_publish'$$,
 '42501','Publication file destination is closed or invalid','privileged final copies also respect a closed destination after draft deletion');
select * from finish();
rollback;
