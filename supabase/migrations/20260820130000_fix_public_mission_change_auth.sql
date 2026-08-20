-- Formaplane — Sprint 11.7.1
-- Correctif : la revalidation publique doit fonctionner sans compte Formaplane.
--
-- Cause :
-- respond_to_public_mission_change() appelait reconcile_trainer_conflicts_safe(),
-- fonction historique qui exige auth.uid() et levait AUTH_REQUIRED pour un
-- formateur répondant via son lien public.
--
-- Correctif :
-- on conserve exactement la même réconciliation métier mais on l'exécute
-- directement dans la fonction publique sécurisée par token.

create or replace function public.respond_to_public_mission_change(
  p_token uuid,
  p_response text,
  p_comment text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.mission_change_request_trainers%rowtype;
  v_request public.mission_change_requests%rowtype;
  v_pending_count integer;
  v_trainer_name text;

  v_conflict_row record;
  v_has_conflict boolean;
  v_expected_status text;
begin
  if p_response not in ('accepted', 'refused') then
    raise exception 'INVALID_RESPONSE';
  end if;

  select *
  into v_target
  from public.mission_change_request_trainers rt
  where rt.public_response_token = p_token
  for update;

  if not found then
    raise exception 'CHANGE_NOT_FOUND';
  end if;

  select *
  into v_request
  from public.mission_change_requests r
  where r.id = v_target.change_request_id
  for update;

  if v_request.status <> 'pending'
     or v_target.response_status <> 'pending' then
    raise exception 'CHANGE_ALREADY_RESPONDED';
  end if;

  update public.mission_change_request_trainers
  set
    response_status = p_response,
    response_comment =
      nullif(btrim(coalesce(p_comment, '')), ''),
    responded_at = now()
  where id = v_target.id;

  select nullif(
    btrim(concat_ws(' ', t.prenom, t.nom)),
    ''
  )
  into v_trainer_name
  from public.trainers t
  where t.id = v_target.trainer_id;

  insert into public.mission_trainer_history (
    mission_id,
    trainer_id,
    mission_formateur_id,
    action,
    previous_status,
    new_status,
    actor_type,
    actor_display_name,
    details
  )
  values (
    v_request.mission_id,
    v_target.trainer_id,
    v_target.mission_formateur_id,
    case
      when p_response = 'accepted'
        then 'change_accepted'
      else 'change_refused'
    end,
    v_target.previous_status,
    v_target.previous_status,
    'trainer',
    coalesce(v_trainer_name, 'Formateur'),
    jsonb_build_object(
      'change_request_id',
      v_request.id,
      'comment',
      nullif(btrim(coalesce(p_comment, '')), ''),
      'source',
      'public_revalidation_link'
    )
  );

  if p_response = 'refused' then
    perform set_config(
      'formaplane.actor_type',
      'trainer',
      true
    );

    update public.mission_formateurs
    set
      statut = 'refuse',
      repondu_le = now(),
      response_comment =
        nullif(btrim(coalesce(p_comment, '')), ''),
      affecte_le = null
    where id = v_target.mission_formateur_id;
  end if;

  select count(*)
  into v_pending_count
  from public.mission_change_request_trainers rt
  where rt.change_request_id = v_request.id
    and rt.response_status = 'pending';

  if v_pending_count = 0 then
    update public.mission_change_requests
    set
      status = 'applied',
      resolved_at = now()
    where id = v_request.id;
  end if;

  /*
   * Réconciliation des conflits du formateur.
   *
   * Même logique que reconcile_trainer_conflicts_safe(), mais sans exiger
   * auth.uid() puisque l'identité du formateur est déjà garantie par le
   * token public_response_token aléatoire et unique.
   */
  for v_conflict_row in
    select
      mf.id,
      mf.mission_id,
      mf.statut
    from public.mission_formateurs mf
    where mf.formateur_id = v_target.trainer_id
      and mf.statut in (
        'accepte',
        'indisponible_affecte_ailleurs'
      )
  loop
    select exists (
      select 1
      from public.mission_formateurs affected
      join public.mission_dates affected_date
        on affected_date.mission_id =
          affected.mission_id
      join public.mission_dates option_date
        on option_date.mission_id =
          v_conflict_row.mission_id
        and option_date.date =
          affected_date.date
      where affected.formateur_id =
        v_target.trainer_id
        and affected.statut = 'affecte'
        and affected.mission_id <>
          v_conflict_row.mission_id
    )
    into v_has_conflict;

    v_expected_status :=
      case
        when v_has_conflict
          then 'indisponible_affecte_ailleurs'
        else 'accepte'
      end;

    if v_conflict_row.statut <>
       v_expected_status then
      update public.mission_formateurs
      set
        statut = v_expected_status,
        affecte_le = null
      where id = v_conflict_row.id;
    end if;
  end loop;

  return p_response;
end;
$$;

revoke all
on function public.respond_to_public_mission_change(
  uuid,
  text,
  text
)
from public;

grant execute
on function public.respond_to_public_mission_change(
  uuid,
  text,
  text
)
to anon, authenticated;
