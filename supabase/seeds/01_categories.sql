insert into public.categories (
  id,
  slug,
  name_ua,
  name_en,
  description_ua,
  description_en
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'chairs',
    'Стільці',
    'Chairs',
    'Преміальні стільці та акцентні крісла для сучасних інтерʼєрів.',
    'Premium chairs and accent seating for modern interiors.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'sofas',
    'Дивани',
    'Sofas',
    'Модульні та характерні дивани для житлових сцен.',
    'Modular and statement sofas for residential scenes.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'tables',
    'Столи',
    'Tables',
    'Обідні, журнальні та допоміжні столи для архвізу.',
    'Dining, coffee, and side tables for archviz scenes.'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'lighting',
    'Освітлення',
    'Lighting',
    'Підвісні, настінні та акцентні світильники для атмосферних кадрів.',
    'Pendant, wall, and accent lighting for atmospheric renders.'
  )
on conflict (id) do update
set
  slug = excluded.slug,
  name_ua = excluded.name_ua,
  name_en = excluded.name_en,
  description_ua = excluded.description_ua,
  description_en = excluded.description_en;
