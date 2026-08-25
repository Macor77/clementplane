-- Sprint 17.2 — Dashboard Admin, statistiques d'utilisation et instrumentation légère

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  context text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint product_events_event_name_not_blank check (btrim(event_name) <> '')
);

create index if not exists product_events_occurred_at_idx on public.product_events(occurred_at desc);
create index if not exists product_events_user_event_idx on public.product_events(user_id, event_name, occurred_at desc);

alter table public.product_events enable row level security;
revoke all on public.product_events from anon, authenticated;

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
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_name not in (
    'organization_dashboard_viewed','trainer_dashboard_viewed','trainer_search_viewed',
    'missions_viewed','planning_viewed','availability_viewed','availability_share_viewed',
    'proposals_viewed','discover_viewed'
  ) then raise exception 'INVALID_EVENT'; end if;

  insert into public.product_events(user_id,event_name,context,metadata)
  values(auth.uid(),p_event_name,nullif(btrim(coalesce(p_context,'')),''),coalesce(p_metadata,'{}'::jsonb));
end;
$$;

grant execute on function public.track_product_event(text,text,jsonb) to authenticated;

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  select jsonb_build_object(
    'accounts', jsonb_build_object(
      'total', (select count(*) from public.profiles),
      'new_7d', (select count(*) from public.profiles where created_at >= now()-interval '7 days'),
      'new_30d', (select count(*) from public.profiles where created_at >= now()-interval '30 days'),
      'organization_profiles', (select count(distinct om.user_id) from public.organization_members om where om.status='active'),
      'claimed_trainers', (select count(*) from public.trainers t where t.user_id is not null),
      'double_profiles', (select count(*) from public.trainers t where t.user_id is not null and exists(select 1 from public.organization_members om where om.user_id=t.user_id and om.status='active'))
    ),
    'organizations', jsonb_build_object(
      'total', (select count(*) from public.organizations),
      'active', (select count(*) from public.organizations where status='active'),
      'new_30d', (select count(*) from public.organizations where created_at >= now()-interval '30 days')
    ),
    'missions', jsonb_build_object(
      'total', (select count(*) from public.missions),
      'new_30d', (select count(*) from public.missions where created_at >= now()-interval '30 days'),
      'assigned', (select count(distinct mission_id) from public.mission_formateurs where statut='affecte'),
      'proposals_sent', (select count(*) from public.mission_formateurs where propose_le is not null),
      'proposals_sent_30d', (select count(*) from public.mission_formateurs where propose_le >= now()-interval '30 days'),
      'responses', (select count(*) from public.mission_formateurs where repondu_le is not null),
      'accepted', (select count(*) from public.mission_formateurs where repondu_le is not null and statut in ('accepte','affecte')),
      'refused', (select count(*) from public.mission_formateurs where repondu_le is not null and statut='refuse'),
      'viewed', (select count(*) from public.mission_formateurs where proposal_viewed_at is not null)
    ),
    'availability', jsonb_build_object(
      'trainers_with_availability', (select count(distinct trainer_id) from public.trainer_availability where coalesce(status,'') <> ''),
      'updated_30d', (select count(distinct trainer_id) from public.trainer_availability where updated_at >= now()-interval '30 days'),
      'shares_total', (select count(*) from public.email_logs where email_type='trainer_availability_share' and status not in ('failed','hard_bounce','blocked','invalid')),
      'shares_30d', (select count(*) from public.email_logs where email_type='trainer_availability_share' and created_at >= now()-interval '30 days' and status not in ('failed','hard_bounce','blocked','invalid'))
    ),
    'emails', jsonb_build_object(
      'total', (select count(*) from public.email_logs),
      'sent_30d', (select count(*) from public.email_logs where created_at >= now()-interval '30 days'),
      'delivered_30d', (select count(*) from public.email_logs where created_at >= now()-interval '30 days' and status='delivered'),
      'failed_30d', (select count(*) from public.email_logs where created_at >= now()-interval '30 days' and status in ('failed','hard_bounce','blocked','invalid')),
      'opened_30d', (select count(*) from public.email_logs where created_at >= now()-interval '30 days' and opened_at is not null),
      'clicked_30d', (select count(*) from public.email_logs where created_at >= now()-interval '30 days' and clicked_at is not null)
    ),
    'support', jsonb_build_object(
      'total', (select count(*) from public.support_requests),
      'open', (select count(*) from public.support_requests where status in ('new','in_progress')),
      'new_30d', (select count(*) from public.support_requests where created_at >= now()-interval '30 days'),
      'resolved', (select count(*) from public.support_requests where status in ('resolved','closed'))
    ),
    'usage', jsonb_build_object(
      'events_30d', (select count(*) from public.product_events where occurred_at >= now()-interval '30 days'),
      'active_users_7d', (select count(distinct user_id) from public.product_events where occurred_at >= now()-interval '7 days'),
      'active_users_30d', (select count(distinct user_id) from public.product_events where occurred_at >= now()-interval '30 days'),
      'by_event_30d', coalesce((select jsonb_agg(jsonb_build_object('event_name',x.event_name,'events',x.events,'users',x.users) order by x.events desc) from (select event_name,count(*) events,count(distinct user_id) users from public.product_events where occurred_at >= now()-interval '30 days' group by event_name) x),'[]'::jsonb)
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;
