-- Sprint 17.3 hotfix
-- La base historique Formaplane ne possède pas nécessairement profiles.account_status.
-- Le calcul des destinataires ne doit donc pas dépendre de cette colonne.

create or replace function public.admin_feature_news_recipient_payload(p_audiences text[])
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  insert into public.feature_news_preferences(user_id)
  select p.id
  from public.profiles p
  on conflict (user_id) do nothing;

  with base as (
    select
      u.id as user_id,
      u.email::text as email,
      p.first_name::text as first_name,
      exists (
        select 1
        from public.organization_members om
        where om.user_id = u.id
          and om.status = 'active'
      ) as has_organization,
      exists (
        select 1
        from public.trainers t
        where t.user_id = u.id
      ) as has_trainer,
      pref.subscribed,
      pref.unsubscribe_token
    from auth.users u
    join public.profiles p on p.id = u.id
    join public.feature_news_preferences pref on pref.user_id = u.id
    where u.email is not null
  ),
  selected as (
    select *
    from base b
    where
      ('organization' = any(p_audiences) and b.has_organization)
      or ('trainer' = any(p_audiences) and b.has_trainer)
      or ('both' = any(p_audiences) and b.has_organization and b.has_trainer)
  ),
  eligible as (
    select *
    from selected
    where subscribed = true
  )
  select jsonb_build_object(
    'selected_total', (select count(*) from selected),
    'eligible', (select count(*) from eligible),
    'unsubscribed_selected', (select count(*) from selected where subscribed = false),
    'recipients',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'user_id', e.user_id,
              'email', e.email,
              'first_name', e.first_name,
              'has_organization', e.has_organization,
              'has_trainer', e.has_trainer,
              'unsubscribe_token', e.unsubscribe_token
            )
            order by e.email
          )
          from eligible e
        ),
        '[]'::jsonb
      )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.admin_feature_news_recipient_payload(text[]) to authenticated;
