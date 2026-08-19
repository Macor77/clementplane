-- ==========================================================
-- SPRINT 11.3.3
-- Historique des invitations formateur + anti-relance listing
-- ==========================================================

create index if not exists email_logs_trainer_invitation_lookup_idx
  on public.email_logs (
    organization_id,
    related_entity_id,
    email_type,
    status,
    sent_at desc
  )
  where email_type = 'trainer_claim_invitation';

create or replace function public.get_trainer_invitation_history(
  p_organization_id uuid,
  p_trainer_id uuid default null
)
returns table (
  id uuid,
  trainer_id uuid,
  recipient_email text,
  status text,
  created_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception 'Organization access denied';
  end if;

  return query
  select
    el.id,
    el.related_entity_id as trainer_id,
    el.recipient_email,
    el.status,
    el.created_at,
    el.sent_at,
    el.failed_at,
    el.error_message
  from public.email_logs el
  where el.organization_id = p_organization_id
    and el.email_type = 'trainer_claim_invitation'
    and el.related_entity_type = 'trainer'
    and (p_trainer_id is null or el.related_entity_id = p_trainer_id)
  order by coalesce(el.sent_at, el.failed_at, el.created_at) desc;
end;
$$;

revoke all on function public.get_trainer_invitation_history(uuid, uuid) from public;
grant execute on function public.get_trainer_invitation_history(uuid, uuid) to authenticated;
