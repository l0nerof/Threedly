create function public.get_profile_library_page(
  requested_tab text default 'downloaded',
  requested_page integer default 1
)
returns table (
  profile_id uuid,
  active_tab text,
  current_page integer,
  total_pages bigint,
  downloaded_count bigint,
  favorite_count bigint,
  followed_count bigint,
  models jsonb,
  designers jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with caller as (
    select profile.id,
      case when requested_tab in ('downloaded', 'favoriteModels', 'subscriptions')
        then requested_tab else 'downloaded' end as tab
    from public.profiles as profile
    where profile.id = (select auth.uid())
  ), downloaded as (
    select download.model_id, max(download.created_at) as saved_at
    from public.downloads as download
    join caller on caller.id = download.user_id
    join public.models as model on model.id = download.model_id
    where model.status = 'published'::public.model_status
    group by download.model_id
  ), favorites as (
    select favorite.model_id, favorite.created_at as saved_at
    from public.favorites as favorite
    join caller on caller.id = favorite.user_id
    join public.models as model on model.id = favorite.model_id
    where model.status = 'published'::public.model_status
  ), follows as (
    select follow.designer_id, follow.created_at as saved_at
    from public.designer_follows as follow
    join caller on caller.id = follow.follower_id
    join public.profiles as designer on designer.id = follow.designer_id
  ), counts as (
    select caller.id, caller.tab,
      (select count(*) from downloaded) as downloads,
      (select count(*) from favorites) as favorites,
      (select count(*) from follows) as follows
    from caller
  ), pagination as (
    select counts.*,
      greatest(1::bigint, (
        case counts.tab
          when 'downloaded' then counts.downloads
          when 'favoriteModels' then counts.favorites
          else counts.follows
        end + 23
      ) / 24) as pages
    from counts
  ), bounds as (
    select pagination.*,
      least(greatest(coalesce(requested_page, 1), 1)::bigint, pagination.pages)::integer as page
    from pagination
  ), selected_models as (
    select downloaded.* from downloaded, bounds where bounds.tab = 'downloaded'
    union all
    select favorites.* from favorites, bounds where bounds.tab = 'favoriteModels'
  ), model_page as (
    select model.id, model.slug, model.title_ua, model.title_en,
      model.description_ua, model.description_en, model.cover_image_path,
      model.minimum_plan, model.file_format, model.download_count,
      model.is_featured, model.published_at, selected.saved_at
    from selected_models as selected
    join public.models as model on model.id = selected.model_id
    order by selected.saved_at desc, model.id
    limit 24 offset (select (bounds.page::bigint - 1) * 24 from bounds)
  ), designer_page as (
    select designer.id, designer.username, designer.bio, designer.avatar_path,
      designer.plan_key, designer.created_at, follows.saved_at,
      (select count(*) from public.models as model
        where model.creator_id = designer.id
          and model.status = 'published'::public.model_status) as model_count
    from follows
    join public.profiles as designer on designer.id = follows.designer_id
    cross join bounds
    where bounds.tab = 'subscriptions'
    order by follows.saved_at desc, designer.id
    limit 24 offset (select (bounds.page::bigint - 1) * 24 from bounds)
  )
  select bounds.id, bounds.tab, bounds.page, bounds.pages,
    bounds.downloads, bounds.favorites, bounds.follows,
    coalesce((select jsonb_agg(to_jsonb(model_page) - 'saved_at'
      order by model_page.saved_at desc, model_page.id) from model_page), '[]'::jsonb),
    coalesce((select jsonb_agg(to_jsonb(designer_page) - 'saved_at'
      order by designer_page.saved_at desc, designer_page.id) from designer_page), '[]'::jsonb)
  from bounds;
$$;

revoke execute on function public.get_profile_library_page(text, integer) from public, anon, authenticated;
grant execute on function public.get_profile_library_page(text, integer) to authenticated;
