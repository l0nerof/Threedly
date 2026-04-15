insert into public.model_files (
  id,
  model_id,
  storage_provider,
  bucket,
  object_path,
  file_name,
  format,
  file_size_bytes,
  is_primary
)
values
  (
    '22222222-2222-2222-2222-222222222101',
    '11111111-1111-1111-1111-111111111101',
    'supabase',
    'marketplace-files',
    'demo/nordic-accent-chair.glb',
    'nordic-accent-chair.glb',
    'glb',
    1843200,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222102',
    '11111111-1111-1111-1111-111111111102',
    'supabase',
    'marketplace-files',
    'demo/modular-linen-sofa.fbx',
    'modular-linen-sofa.fbx',
    'fbx',
    6246400,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222103',
    '11111111-1111-1111-1111-111111111103',
    'supabase',
    'marketplace-files',
    'demo/stone-coffee-table.glb',
    'stone-coffee-table.glb',
    'glb',
    1423360,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222104',
    '11111111-1111-1111-1111-111111111104',
    'supabase',
    'marketplace-files',
    'demo/orb-pendant-light.max',
    'orb-pendant-light.max',
    'max',
    980000,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222105',
    '11111111-1111-1111-1111-111111111105',
    'supabase',
    'marketplace-files',
    'demo/solid-oak-dining-table.fbx',
    'solid-oak-dining-table.fbx',
    'fbx',
    7120896,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222106',
    '11111111-1111-1111-1111-111111111106',
    'supabase',
    'marketplace-files',
    'demo/curved-studio-sofa.glb',
    'curved-studio-sofa.glb',
    'glb',
    5586944,
    true
  )
on conflict (id) do update
set
  model_id = excluded.model_id,
  storage_provider = excluded.storage_provider,
  bucket = excluded.bucket,
  object_path = excluded.object_path,
  file_name = excluded.file_name,
  format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  is_primary = excluded.is_primary;
