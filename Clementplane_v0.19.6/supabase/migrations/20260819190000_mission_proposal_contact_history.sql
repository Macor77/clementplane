-- Sprint 11.5.1.4 — Historique multicanal des propositions / relances

create or replace function public.record_mission_proposal_contact(
  p_mission_formateur_id uuid,
  p_channel text,
  p_is_reminder boolean default false,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mission_id uuid;
  v_trainer_id uuid;
  v_organization_id uuid;
  v_organization_name text;
  v_actor_name text;
  v_history_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentification requise.';
  end if;

  if p_channel not in ('email', 'sms', 'whatsapp', 'phone', 'other') then
    raise exception 'Canal de contact non reconnu.';
  end if;

  if p_channel = 'other' and nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'Précisez le moyen de contact utilisé.';
  end if;

  select
    mf.mission_id,
    mf.formateur_id,
    m.organization_id,
    coalesce(o.name, o.legal_name)
  into
    v_mission_id,
    v_trainer_id,
    v_organization_id,
    v_organization_name
  from public.mission_formateurs mf
  join public.missions m on m.id = mf.mission_id
  join public.organizations o on o.id = m.organization_id
  where mf.id = p_mission_formateur_id;

  if v_mission_id is null then
    raise exception 'Proposition introuvable.';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = v_organization_id
      and om.user_id = v_user_id
      and om.status = 'active'
  ) then
    raise exception 'Vous n’avez pas accès à cette mission.';
  end if;

  select nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '')
  into v_actor_name
  from public.profiles p
  where p.id = v_user_id;

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
    v_mission_id,
    v_trainer_id,
    p_mission_formateur_id,
    'proposal_contact',
    'proposition_envoyee',
    'proposition_envoyee',
    v_user_id,
    'organization',
    coalesce(v_actor_name, 'Utilisateur'),
    v_organization_id,
    v_organization_name,
    jsonb_build_object(
      'channel', p_channel,
      'is_reminder', coalesce(p_is_reminder, false),
      'note', nullif(btrim(coalesce(p_note, '')), '')
    )
  )
  returning id into v_history_id;

  return v_history_id;
end;
$$;

revoke all on function public.record_mission_proposal_contact(uuid, text, boolean, text) from public;
grant execute on function public.record_mission_proposal_contact(uuid, text, boolean, text) to authenticated;
