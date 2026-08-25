-- Sprint 17.2 — fiabilisation et enrichissement du dashboard Admin

-- Date de revendication : l'historique antérieur n'existait pas. Les profils déjà
-- revendiqués prennent comme point de départ la date de cette migration ; les
-- prochaines revendications seront datées exactement par trigger.
alter table public.trainers add column if not exists claimed_at timestamptz;
update public.trainers set claimed_at = now() where user_id is not null and claimed_at is null;

create or replace function public.set_trainer_claimed_at()
returns trigger language plpgsql set search_path=public as $$
begin
  if old.user_id is null and new.user_id is not null and new.claimed_at is null then new.claimed_at=now(); end if;
  if new.user_id is null then new.claimed_at=null; end if;
  return new;
end; $$;
drop trigger if exists trainers_set_claimed_at on public.trainers;
create trigger trainers_set_claimed_at before update of user_id on public.trainers
for each row execute function public.set_trainer_claimed_at();

create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare result jsonb; v_now timestamptz:=now();
begin
 if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 select jsonb_build_object(
 'accounts',jsonb_build_object(
   'total',(select count(*) from profiles),
   'new_7d',(select count(*) from profiles where created_at>=v_now-interval '7 days'),
   'new_30d',(select count(*) from profiles where created_at>=v_now-interval '30 days'),
   'organization_profiles',(select count(distinct user_id) from organization_members where status='active'),
   'claimed_trainers',(select count(*) from trainers where user_id is not null),
   'double_profiles',(select count(*) from trainers t where user_id is not null and exists(select 1 from organization_members om where om.user_id=t.user_id and om.status='active')),
   'active_users_7d',(select count(*) from auth.users u join profiles p on p.id=u.id where u.last_sign_in_at>=v_now-interval '7 days'),
   'active_organizations_7d',(select count(distinct om.organization_id) from organization_members om join auth.users u on u.id=om.user_id where om.status='active' and u.last_sign_in_at>=v_now-interval '7 days'),
   'active_trainers_7d',(select count(distinct t.id) from trainers t join auth.users u on u.id=t.user_id where u.last_sign_in_at>=v_now-interval '7 days')
 ),
 'organizations',jsonb_build_object(
   'total',(select count(*) from organizations), 'active',(select count(*) from organizations where status='active'),
   'new_30d',(select count(*) from organizations where created_at>=v_now-interval '30 days'),
   'with_trainer_added_30d',(select count(distinct organization_id) from organization_trainers where created_at>=v_now-interval '30 days'),
   'referenced_trainers_total',(select count(*) from organization_trainers),
   'avg_referenced_trainers',coalesce((select round(avg(c)::numeric,1) from (select o.id,count(ot.id)::numeric c from organizations o left join organization_trainers ot on ot.organization_id=o.id group by o.id)x),0),
   'median_referenced_trainers',coalesce((select percentile_cont(.5) within group(order by c) from (select o.id,count(ot.id)::numeric c from organizations o left join organization_trainers ot on ot.organization_id=o.id group by o.id)x),0)
 ),
 'missions',jsonb_build_object(
   'total',(select count(*) from missions),'new_30d',(select count(*) from missions where created_at>=v_now-interval '30 days'),
   'assigned',(select count(distinct mission_id) from mission_formateurs where statut='affecte'),
   'proposals_sent',(select count(*) from mission_formateurs where propose_le is not null),
   'proposals_sent_30d',(select count(*) from mission_formateurs where propose_le>=v_now-interval '30 days'),
   'responses',(select count(*) from mission_formateurs where repondu_le is not null),
   'accepted',(select count(*) from mission_formateurs where repondu_le is not null and statut in('accepte','affecte')),
   'refused',(select count(*) from mission_formateurs where repondu_le is not null and statut='refuse'),
   'other_responses',(select count(*) from mission_formateurs where repondu_le is not null and statut not in('accepte','affecte','refuse')),
   'viewed',(select count(*) from mission_formateurs where proposal_viewed_at is not null)
 ),
 'availability',jsonb_build_object(
   'manual_active_30d',(select count(distinct h.trainer_id) from trainer_availability_history h join trainers t on t.id=h.trainer_id where h.created_at>=v_now-interval '30 days' and h.source='trainer' and h.changed_by_user_id=t.user_id),
   'shares_total',(select count(*) from email_logs where email_type='trainer_availability_share' and status not in('failed','hard_bounce','blocked','invalid')),
   'shares_30d',(select count(*) from email_logs where email_type='trainer_availability_share' and created_at>=v_now-interval '30 days' and status not in('failed','hard_bounce','blocked','invalid'))
 ),
 'emails',jsonb_build_object(
   'total',(select count(*) from email_logs),'sent_30d',(select count(*) from email_logs where created_at>=v_now-interval '30 days'),
   'delivered_30d',(select count(*) from email_logs where created_at>=v_now-interval '30 days' and status='delivered'),
   'failed_30d',(select count(*) from email_logs where created_at>=v_now-interval '30 days' and status in('failed','hard_bounce','blocked','invalid')),
   'opened_30d',(select count(*) from email_logs where created_at>=v_now-interval '30 days' and opened_at is not null),
   'clicked_30d',(select count(*) from email_logs where created_at>=v_now-interval '30 days' and clicked_at is not null)
 ),
 'support',jsonb_build_object('total',(select count(*) from support_requests),'open',(select count(*) from support_requests where status in('new','in_progress')),'new_30d',(select count(*) from support_requests where created_at>=v_now-interval '30 days'),'resolved',(select count(*) from support_requests where status in('resolved','closed'))),
 'usage',jsonb_build_object('events_30d',(select count(*) from product_events where occurred_at>=v_now-interval '30 days'),'active_users_7d',(select count(distinct user_id) from product_events where occurred_at>=v_now-interval '7 days'),'by_event_30d',coalesce((select jsonb_agg(jsonb_build_object('event_name',event_name,'events',events,'users',users) order by events desc) from(select event_name,count(*) events,count(distinct user_id) users from product_events where occurred_at>=v_now-interval '30 days' group by event_name)x),'[]'::jsonb)),
 'curves',jsonb_build_object(
   'users',(select jsonb_agg(jsonb_build_object('date',d::date,'value',(select count(*) from profiles where created_at<d+interval '1 day')) order by d) from generate_series(current_date-29,current_date,interval '1 day')d),
   'missions',(select jsonb_agg(jsonb_build_object('date',d::date,'value',(select count(*) from missions where created_at>=d and created_at<d+interval '1 day')) order by d) from generate_series(current_date-29,current_date,interval '1 day')d),
   'trainers_created',(select jsonb_agg(jsonb_build_object('date',d::date,'value',(select count(*) from trainers where created_at>=d and created_at<d+interval '1 day')) order by d) from generate_series(current_date-29,current_date,interval '1 day')d),
   'trainers_claimed',(select jsonb_agg(jsonb_build_object('date',d::date,'value',(select count(*) from trainers where claimed_at is not null and claimed_at<d+interval '1 day')) order by d) from generate_series(current_date-29,current_date,interval '1 day')d),
   'active_users_7d',(select jsonb_agg(jsonb_build_object('date',d::date,'value',(select count(distinct user_id) from product_events where occurred_at>=d-interval '6 days' and occurred_at<d+interval '1 day')) order by d) from generate_series(current_date-29,current_date,interval '1 day')d)
 )) into result;
 return result;
end; $$;
grant execute on function public.admin_dashboard_stats() to authenticated;
