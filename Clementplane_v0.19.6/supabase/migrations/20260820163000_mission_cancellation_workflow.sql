-- Formaplane — Sprint 11.8
-- Annulation atomique d'une mission et clôture des relations actives.

create or replace function public.cancel_mission_with_trainers(
  p_mission_id uuid,
  p_channel text,
  p_note text default null
)
returns table (
  cancelled_trainers integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_channel not in ('email', 'sms', 'whatsapp', 'phone', 'other') then
    raise exception 'INVALID_CHANNEL';
  end if;

  if p_channel = 'other'
     and nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'CONTACT_NOTE_REQUIRED';
  end if;

  select m.organization_id
  into v_organization_id
  from public.missions m
  where m.id = p_mission_id
  for update;

  if v_organization_id is null then
    raise exception 'MISSION_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = v_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if exists (
    select 1
    from public.missions m
    where m.id = p_mission_id
      and m.statut = 'annulee'
  ) then
    raise exception 'MISSION_ALREADY_CANCELLED';
  end if;

  perform set_config('formaplane.actor_type', 'organization', true);

  update public.mission_formateurs
  set
    statut = 'annule',
    affecte_le = null
  where mission_id = p_mission_id
    and statut in (
      'proposition_envoyee',
      'accepte',
      'affecte',
      'indisponible_affecte_ailleurs'
    );

  get diagnostics v_count = row_count;

  update public.missions
  set statut = 'annulee'
  where id = p_mission_id;

  update public.mission_change_requests
  set
    status = 'cancelled',
    resolved_at = now()
  where mission_id = p_mission_id
    and status = 'pending';

  update public.mission_change_request_trainers rt
  set
    response_status = 'cancelled',
    responded_at = now()
  from public.mission_change_requests r
  where rt.change_request_id = r.id
    and r.mission_id = p_mission_id
    and rt.response_status = 'pending';

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
    details
  )
  select
    p_mission_id,
    mf.formateur_id,
    mf.id,
    'cancellation_contact',
    mf.statut,
    mf.statut,
    auth.uid(),
    'organization',
    coalesce(
      nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
      'Utilisateur'
    ),
    v_organization_id,
    jsonb_build_object(
      'channel', p_channel,
      'note', nullif(btrim(coalesce(p_note, '')), '')
    )
  from public.mission_formateurs mf
  left join public.profiles p on p.id = auth.uid()
  where mf.mission_id = p_mission_id
    and mf.statut = 'annule';

  return query select v_count;
end;
$$;

revoke all on function public.cancel_mission_with_trainers(uuid, text, text) from public;
grant execute on function public.cancel_mission_with_trainers(uuid, text, text) to authenticated;
