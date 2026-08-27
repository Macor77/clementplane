-- Sprint 20 — adoption PWA et répartition des ouvertures navigateur / PWA.
-- Réutilise product_events : aucune donnée d'appareil, modèle ou identifiant matériel n'est stockée.

create or replace function public.track_product_event(
  p_event_name text,
  p_context text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_access_mode text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_name not in (
    'organization_dashboard_viewed','trainer_dashboard_viewed','trainer_search_viewed',
    'missions_viewed','planning_viewed','availability_viewed','availability_share_viewed',
    'proposals_viewed','discover_viewed','client_error','app_opened'
  ) then raise exception 'INVALID_EVENT'; end if;

  if p_event_name = 'app_opened' then
    v_access_mode := coalesce(p_metadata->>'access_mode', p_context);
    if v_access_mode not in ('pwa','browser') then
      raise exception 'INVALID_ACCESS_MODE';
    end if;
  end if;

  insert into public.product_events(user_id,event_name,context,metadata)
  values(
    auth.uid(),
    p_event_name,
    left(nullif(btrim(coalesce(p_context,'')),''),120),
    coalesce(p_metadata,'{}'::jsonb)
  );
end;
$$;

grant execute on function public.track_product_event(text,text,jsonb) to authenticated;

create or replace function public.admin_pwa_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_now timestamptz := now();
  result jsonb;
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  with pwa_users as (
    select distinct pe.user_id
    from public.product_events pe
    where pe.event_name = 'app_opened'
      and coalesce(pe.metadata->>'access_mode', pe.context) = 'pwa'
  ),
  pwa_users_30d as (
    select distinct pe.user_id
    from public.product_events pe
    where pe.event_name = 'app_opened'
      and coalesce(pe.metadata->>'access_mode', pe.context) = 'pwa'
      and pe.occurred_at >= v_now - interval '30 days'
  ),
  openings_30d as (
    select coalesce(pe.metadata->>'access_mode', pe.context) as access_mode, count(*)::bigint as openings
    from public.product_events pe
    where pe.event_name = 'app_opened'
      and pe.occurred_at >= v_now - interval '30 days'
      and coalesce(pe.metadata->>'access_mode', pe.context) in ('pwa','browser')
    group by coalesce(pe.metadata->>'access_mode', pe.context)
  )
  select jsonb_build_object(
    'accounts_total', (select count(*) from public.profiles),
    'pwa_users_total', (select count(*) from pwa_users),
    'pwa_users_30d', (select count(*) from pwa_users_30d),
    'organization_users_total', (
      select count(distinct om.user_id)
      from public.organization_members om
      where om.status = 'active'
    ),
    'pwa_organization_users', (
      select count(distinct om.user_id)
      from public.organization_members om
      join pwa_users pu on pu.user_id = om.user_id
      where om.status = 'active'
    ),
    'trainer_users_total', (
      select count(distinct t.user_id)
      from public.trainers t
      where t.user_id is not null
    ),
    'pwa_trainer_users', (
      select count(distinct t.user_id)
      from public.trainers t
      join pwa_users pu on pu.user_id = t.user_id
      where t.user_id is not null
    ),
    'openings_30d', coalesce((select sum(openings) from openings_30d), 0),
    'pwa_openings_30d', coalesce((select openings from openings_30d where access_mode = 'pwa'), 0),
    'browser_openings_30d', coalesce((select openings from openings_30d where access_mode = 'browser'), 0)
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_pwa_stats() to authenticated;
