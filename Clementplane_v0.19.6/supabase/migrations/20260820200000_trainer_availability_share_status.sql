-- ============================================================
-- FORMAPLANE
-- Sprint 12.3 — Dernier partage de disponibilités par contact
--
-- L'historique complet reste dans email_logs.
-- Le formateur ne reçoit via cette RPC que la dernière trace
-- relative à chacun de SES contacts de partage.
-- ============================================================

alter table public.email_logs
  add column if not exists delivered_at timestamptz;

create or replace function public.get_my_availability_contact_last_share_status()
returns table (
  contact_id uuid,
  email_log_id uuid,
  delivery_status text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  shared_months text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as contact_id,
    latest.id as email_log_id,
    latest.status as delivery_status,
    latest.sent_at,
    latest.delivered_at,
    latest.failed_at,
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(
            latest.metadata -> 'months',
            '[]'::jsonb
          )
        )
      ),
      array[]::text[]
    ) as shared_months
  from public.trainer_availability_contacts c
  left join lateral (
    select e.*
    from public.email_logs e
    where e.email_type = 'trainer_availability_share'
      and e.related_entity_type = 'trainer_availability_contact'
      and e.related_entity_id = c.id
    order by e.created_at desc
    limit 1
  ) latest on true
  where c.trainer_id = public.current_trainer_profile_id();
$$;

revoke all
on function public.get_my_availability_contact_last_share_status()
from public;

revoke all
on function public.get_my_availability_contact_last_share_status()
from anon;

grant execute
on function public.get_my_availability_contact_last_share_status()
to authenticated;
