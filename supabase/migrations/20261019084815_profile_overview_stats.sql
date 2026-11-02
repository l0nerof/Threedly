create function public.get_profile_overview()
returns table (
  profile_id uuid,
  plan_key public.plan_key,
  downloads_limit_monthly integer,
  downloads_used_this_month bigint,
  published_uploads bigint,
  favorite_models bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    profile.id,
    profile.plan_key,
    profile.downloads_limit_monthly,
    (
      select count(distinct download.model_id)
        + count(*) filter (where download.model_id is null)
      from public.downloads as download
      where download.user_id = profile.id
        and download.created_at >= date_trunc('month', now() at time zone 'UTC') at time zone 'UTC'
        and download.created_at < (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC'
    ),
    (
      select count(*)
      from public.models as model
      where model.creator_id = profile.id
        and model.status = 'published'::public.model_status
    ),
    (
      select count(*)
      from public.favorites as favorite
      join public.models as model on model.id = favorite.model_id
      where favorite.user_id = profile.id
        and model.status = 'published'::public.model_status
    )
  from public.profiles as profile
  where profile.id = (select auth.uid());
$$;

revoke execute on function public.get_profile_overview() from public, anon, authenticated;
grant execute on function public.get_profile_overview() to authenticated;
