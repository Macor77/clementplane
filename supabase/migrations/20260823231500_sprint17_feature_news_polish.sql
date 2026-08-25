-- Sprint 17.3 polish — compteur destinataires + historique détaillé
insert into public.feature_news_preferences(user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function public.admin_feature_news_recipients(p_audiences text[])
returns table(
  user_id uuid,
  email text,
  first_name text,
  has_organization boolean,
  has_trainer boolean,
  unsubscribe_token uuid
)
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  return query
  with base as (
    select
      u.id as uid,
      u.email::text as mail,
      p.first_name as fname,
      exists(
        select 1
        from public.organization_members om
        where om.user_id=u.id and om.status='active'
      ) as has_org,
      exists(
        select 1
        from public.trainers t
        where t.user_id=u.id
      ) as has_tr,
      pref.unsubscribe_token as token,
      coalesce(pref.subscribed,true) as is_subscribed
    from auth.users u
    join public.profiles p on p.id=u.id
    left join public.feature_news_preferences pref on pref.user_id=u.id
    where p.account_status='active' and u.email is not null
  )
  select
    b.uid, b.mail, b.fname, b.has_org, b.has_tr, b.token
  from base b
  where b.is_subscribed
    and (
      ('organization'=any(p_audiences) and b.has_org)
      or ('trainer'=any(p_audiences) and b.has_tr)
      or ('both'=any(p_audiences) and b.has_org and b.has_tr)
    );
end
$$;

grant execute on function public.admin_feature_news_recipients(text[]) to authenticated;

create or replace function public.admin_feature_news_preview(p_audiences text[])
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_eligible integer := 0;
  v_unsubscribed integer := 0;
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  select count(*) into v_eligible
  from public.admin_feature_news_recipients(p_audiences);

  with selected as (
    select distinct u.id
    from auth.users u
    join public.profiles p on p.id=u.id
    where p.account_status='active'
      and (
        ('organization'=any(p_audiences) and exists(
          select 1 from public.organization_members om
          where om.user_id=u.id and om.status='active'
        ))
        or ('trainer'=any(p_audiences) and exists(
          select 1 from public.trainers t where t.user_id=u.id
        ))
        or ('both'=any(p_audiences) and exists(
          select 1 from public.organization_members om
          where om.user_id=u.id and om.status='active'
        ) and exists(
          select 1 from public.trainers t where t.user_id=u.id
        ))
      )
  )
  select count(*) into v_unsubscribed
  from selected s
  join public.feature_news_preferences pref on pref.user_id=s.id
  where pref.subscribed=false;

  return jsonb_build_object(
    'eligible',v_eligible,
    'unsubscribed_selected',v_unsubscribed
  );
end
$$;

grant execute on function public.admin_feature_news_preview(text[]) to authenticated;
