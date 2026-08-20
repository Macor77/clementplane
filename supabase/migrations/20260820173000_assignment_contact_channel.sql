-- Formaplane — Sprint 11.8.2
-- Historisation du canal utilisé pour informer un formateur
-- lors d'une affectation ou d'une désaffectation.

create or replace function public.record_mission_assignment_contact(
  p_mission_id uuid,
  p_trainer_id uuid,
  p_action text,
  p_channel text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_organization_name text;
  v_actor_name text;
  v_mission_formateur_id uuid;
  v_current_status text;
  v_history_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_action not in (
    'assignment',
    'unassignment'
  ) then
    raise exception 'INVALID_ACTION';
  end if;

  if p_channel not in (
    'email',
    'sms',
    'whatsapp',
    'phone',
    'other'
  ) then
    raise exception 'INVALID_CHANNEL';
  end if;

  if
    p_channel = 'other'
    and nullif(
      btrim(coalesce(p_note, '')),
      ''
    ) is null
  then
    raise exception 'CONTACT_NOTE_REQUIRED';
  end if;

  select
    m.organization_id,
    coalesce(
      o.name,
      o.legal_name
    )
  into
    v_organization_id,
    v_organization_name
  from public.missions m
  join public.organizations o
    on o.id = m.organization_id
  where m.id = p_mission_id;

  if v_organization_id is null then
    raise exception 'MISSION_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id =
      v_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  select
    mf.id,
    mf.statut
  into
    v_mission_formateur_id,
    v_current_status
  from public.mission_formateurs mf
  where mf.mission_id = p_mission_id
    and mf.formateur_id = p_trainer_id
  limit 1;

  if v_mission_formateur_id is null then
    raise exception 'MISSION_TRAINER_NOT_FOUND';
  end if;

  select nullif(
    btrim(
      concat_ws(
        ' ',
        p.first_name,
        p.last_name
      )
    ),
    ''
  )
  into v_actor_name
  from public.profiles p
  where p.id = auth.uid();

  insert into public.mission_trainer_history (
    mission_id,
    trainer_id,
    mission_formateur_id,
    action,
    previous_status,
    new_status,
    actor_user_id,
    actor_type,
    actor_display_name,
    actor_organization_id,
    actor_organization_name,
    details
  )
  values (
    p_mission_id,
    p_trainer_id,
    v_mission_formateur_id,
    case
      when p_action = 'assignment'
        then 'assignment_contact'
      else 'unassignment_contact'
    end,
    v_current_status,
    v_current_status,
    auth.uid(),
    'organization',
    coalesce(
      v_actor_name,
      'Utilisateur'
    ),
    v_organization_id,
    v_organization_name,
    jsonb_build_object(
      'channel',
      p_channel,
      'note',
      nullif(
        btrim(coalesce(p_note, '')),
        ''
      ),
      'action',
      p_action
    )
  )
  returning id
  into v_history_id;

  return v_history_id;
end;
$$;

revoke all
on function public.record_mission_assignment_contact(
  uuid,
  uuid,
  text,
  text,
  text
)
from public;

grant execute
on function public.record_mission_assignment_contact(
  uuid,
  uuid,
  text,
  text,
  text
)
to authenticated;
