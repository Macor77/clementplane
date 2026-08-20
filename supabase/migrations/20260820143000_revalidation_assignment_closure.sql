-- Formaplane — Sprint 11.7.3
-- Ferme les revalidations restantes lorsqu'un formateur est affecte.

alter table public.mission_change_request_trainers
  drop constraint if exists mission_change_request_trainers_response_status_check;

alter table public.mission_change_request_trainers
  add constraint mission_change_request_trainers_response_status_check
  check (
    response_status in (
      'pending',
      'accepted',
      'refused',
      'unavailable'
    )
  );

create or replace function public.assign_mission_trainer(
  p_mission_id uuid,
  p_formateur_id uuid
)
returns setof public.mission_formateurs
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_request_id uuid;
begin
  if not exists (
    select 1
    from public.mission_formateurs mf
    where mf.mission_id = p_mission_id
      and mf.formateur_id = p_formateur_id
      and mf.statut in ('accepte', 'affecte')
  ) then
    raise exception 'Le formateur doit avoir accepté la mission avant son affectation.';
  end if;

  update public.mission_formateurs
  set
    statut = 'mission_pourvue',
    affecte_le = null
  where mission_id = p_mission_id
    and formateur_id <> p_formateur_id
    and statut in (
      'selectionne',
      'proposition_envoyee',
      'accepte',
      'affecte'
    );

  update public.mission_formateurs
  set
    statut = 'affecte',
    affecte_le = now()
  where mission_id = p_mission_id
    and formateur_id = p_formateur_id;

  for v_request_id in
    select r.id
    from public.mission_change_requests r
    where r.mission_id = p_mission_id
      and r.status = 'pending'
  loop
    update public.mission_change_request_trainers rt
    set
      response_status = 'unavailable',
      responded_at = now(),
      response_comment = null
    where rt.change_request_id = v_request_id
      and rt.trainer_id <> p_formateur_id
      and rt.response_status = 'pending';

    if not exists (
      select 1
      from public.mission_change_request_trainers rt
      where rt.change_request_id = v_request_id
        and rt.response_status = 'pending'
    ) then
      update public.mission_change_requests
      set
        status = 'applied',
        resolved_at = coalesce(
          resolved_at,
          now()
        )
      where id = v_request_id;
    end if;
  end loop;

  return query
  select mf.*
  from public.mission_formateurs mf
  where mf.mission_id = p_mission_id
    and mf.formateur_id = p_formateur_id;
end;
$$;

grant execute
on function public.assign_mission_trainer(uuid, uuid)
to authenticated;


drop function if exists public.get_public_mission_change(uuid);

create function public.get_public_mission_change(
  p_token uuid
)
returns table (
  request_id uuid,
  request_status text,
  response_status text,
  response_comment text,
  previous_status text,
  relation_status text,
  trainer_first_name text,
  trainer_has_account boolean,
  mission_id uuid,
  mission_title text,
  organization_name text,
  previous_mission jsonb,
  proposed_mission jsonb,
  previous_dates jsonb,
  proposed_dates jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.status,
    rt.response_status,
    rt.response_comment,
    rt.previous_status,
    mf.statut,
    t.prenom,
    (t.user_id is not null),
    m.id,
    coalesce(
      nullif(m.intitule, ''),
      nullif(m.formation, ''),
      'Mission de formation'
    ),
    coalesce(
      o.name,
      o.legal_name,
      'Organisme de formation'
    ),
    r.previous_mission,
    r.proposed_mission,
    r.previous_dates,
    r.proposed_dates
  from public.mission_change_request_trainers rt
  join public.mission_change_requests r
    on r.id = rt.change_request_id
  join public.mission_formateurs mf
    on mf.id = rt.mission_formateur_id
  join public.trainers t
    on t.id = rt.trainer_id
  join public.missions m
    on m.id = r.mission_id
  join public.organizations o
    on o.id = r.organization_id
  where rt.public_response_token = p_token
  limit 1;
$$;

revoke all
on function public.get_public_mission_change(uuid)
from public;

grant execute
on function public.get_public_mission_change(uuid)
to anon, authenticated;


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
  v_relation_status text;
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

  select mf.statut
  into v_relation_status
  from public.mission_formateurs mf
  where mf.id = v_target.mission_formateur_id;

  if
    v_target.response_status = 'unavailable'
    or v_relation_status = 'mission_pourvue'
  then
    raise exception 'MISSION_NO_LONGER_AVAILABLE';
  end if;

  if
    v_request.status <> 'pending'
    or v_target.response_status <> 'pending'
  then
    raise exception 'CHANGE_ALREADY_RESPONDED';
  end if;

  update public.mission_change_request_trainers
  set
    response_status = p_response,
    response_comment =
      nullif(
        btrim(coalesce(p_comment, '')),
        ''
      ),
    responded_at = now()
  where id = v_target.id;

  select nullif(
    btrim(
      concat_ws(
        ' ',
        t.prenom,
        t.nom
      )
    ),
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
    coalesce(
      v_trainer_name,
      'Formateur'
    ),
    jsonb_build_object(
      'change_request_id',
      v_request.id,
      'comment',
      nullif(
        btrim(coalesce(p_comment, '')),
        ''
      ),
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
        nullif(
          btrim(coalesce(p_comment, '')),
          ''
        ),
      affecte_le = null
    where id =
      v_target.mission_formateur_id;
  end if;

  select count(*)
  into v_pending_count
  from public.mission_change_request_trainers rt
  where rt.change_request_id =
    v_request.id
    and rt.response_status = 'pending';

  if v_pending_count = 0 then
    update public.mission_change_requests
    set
      status = 'applied',
      resolved_at = now()
    where id = v_request.id;
  end if;

  for v_conflict_row in
    select
      mf.id,
      mf.mission_id,
      mf.statut
    from public.mission_formateurs mf
    where mf.formateur_id =
      v_target.trainer_id
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

    if
      v_conflict_row.statut <>
      v_expected_status
    then
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
