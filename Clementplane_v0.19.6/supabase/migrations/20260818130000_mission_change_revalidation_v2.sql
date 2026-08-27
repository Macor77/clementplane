-- Formaplane — Sprint 10 — Revalidation V2
-- La mission change immédiatement ; l'engagement du formateur est revalidé.

create or replace function public.request_mission_change(
  p_mission_id uuid,
  p_immediate_changes jsonb,
  p_proposed_mission jsonb,
  p_proposed_dates jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_organization_name text;
  v_request_id uuid;
  v_previous_mission jsonb;
  v_previous_dates jsonb;
  v_actor_name text;
  v_target record;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select m.organization_id, o.name
  into v_organization_id, v_organization_name
  from public.missions m
  left join public.organizations o on o.id = m.organization_id
  where m.id = p_mission_id
  for update of m;

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
    from public.mission_change_requests r
    where r.mission_id = p_mission_id
      and r.status = 'pending'
  ) then
    raise exception 'CHANGE_ALREADY_PENDING';
  end if;

  if not exists (
    select 1
    from public.mission_formateurs mf
    where mf.mission_id = p_mission_id
      and mf.statut in ('accepte', 'affecte')
  ) then
    raise exception 'NO_REVALIDATION_REQUIRED';
  end if;

  select jsonb_build_object(
    'formation', m.formation,
    'lieu', m.lieu,
    'adresse', m.adresse,
    'code_postal', m.code_postal,
    'ville', m.ville,
    'cout_formateur', m.cout_formateur
  )
  into v_previous_mission
  from public.missions m
  where m.id = p_mission_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', md.date,
        'heure_debut', md.heure_debut,
        'heure_fin', md.heure_fin
      ) order by md.date
    ),
    '[]'::jsonb
  )
  into v_previous_dates
  from public.mission_dates md
  where md.mission_id = p_mission_id;

  -- Les champs secondaires peuvent continuer à être modifiés librement.
  update public.missions m
  set
    code_interne = nullif(btrim(coalesce(p_immediate_changes ->> 'code_interne', '')), ''),
    client = nullif(btrim(coalesce(p_immediate_changes ->> 'client', '')), ''),
    intitule = nullif(btrim(coalesce(p_immediate_changes ->> 'intitule', '')), ''),
    competences = coalesce(
      array(select jsonb_array_elements_text(coalesce(p_immediate_changes -> 'competences', '[]'::jsonb))),
      '{}'::text[]
    ),
    materiel = coalesce(
      array(select jsonb_array_elements_text(coalesce(p_immediate_changes -> 'materiel', '[]'::jsonb))),
      '{}'::text[]
    ),
    prix_vente = case
      when nullif(p_immediate_changes ->> 'prix_vente', '') is null then null
      else (p_immediate_changes ->> 'prix_vente')::numeric
    end,
    commentaire = nullif(btrim(coalesce(p_immediate_changes ->> 'commentaire', '')), ''),
    statut = coalesce(nullif(p_immediate_changes ->> 'statut', ''), m.statut),
    formation = nullif(btrim(coalesce(p_proposed_mission ->> 'formation', '')), ''),
    lieu = coalesce(p_proposed_mission ->> 'lieu', ''),
    adresse = nullif(btrim(coalesce(p_proposed_mission ->> 'adresse', '')), ''),
    code_postal = nullif(btrim(coalesce(p_proposed_mission ->> 'code_postal', '')), ''),
    ville = nullif(btrim(coalesce(p_proposed_mission ->> 'ville', '')), ''),
    cout_formateur = case when nullif(p_proposed_mission ->> 'cout_formateur', '') is null then null else (p_proposed_mission ->> 'cout_formateur')::numeric end
  where m.id = p_mission_id;

  delete from public.mission_dates where mission_id = p_mission_id;
  for v_target in select value as date_value from jsonb_array_elements(coalesce(p_proposed_dates, '[]'::jsonb))
  loop
    insert into public.mission_dates (mission_id, date, heure_debut, heure_fin)
    values (p_mission_id, (v_target.date_value ->> 'date')::date,
      coalesce(nullif(v_target.date_value ->> 'heure_debut', ''), '09:00')::time,
      coalesce(nullif(v_target.date_value ->> 'heure_fin', ''), '17:00')::time);
  end loop;

  insert into public.mission_change_requests (
    mission_id,
    organization_id,
    requested_by,
    previous_mission,
    proposed_mission,
    previous_dates,
    proposed_dates
  )
  values (
    p_mission_id,
    v_organization_id,
    auth.uid(),
    v_previous_mission,
    coalesce(p_proposed_mission, '{}'::jsonb),
    v_previous_dates,
    coalesce(p_proposed_dates, '[]'::jsonb)
  )
  returning id into v_request_id;

  insert into public.mission_change_request_trainers (
    change_request_id,
    mission_formateur_id,
    trainer_id,
    previous_status
  )
  select
    v_request_id,
    mf.id,
    mf.formateur_id,
    mf.statut
  from public.mission_formateurs mf
  where mf.mission_id = p_mission_id
    and mf.statut in ('accepte', 'affecte');

  select nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '')
  into v_actor_name
  from public.profiles p
  where p.id = auth.uid();

  for v_target in
    select t.*
    from public.mission_change_request_trainers t
    where t.change_request_id = v_request_id
  loop
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
      v_target.trainer_id,
      v_target.mission_formateur_id,
      'change_requested',
      v_target.previous_status,
      v_target.previous_status,
      auth.uid(),
      'organization',
      coalesce(v_actor_name, 'Utilisateur'),
      v_organization_id,
      v_organization_name,
      jsonb_build_object(
        'change_request_id', v_request_id,
        'previous_mission', v_previous_mission,
        'proposed_mission', coalesce(p_proposed_mission, '{}'::jsonb),
        'previous_dates', v_previous_dates,
        'proposed_dates', coalesce(p_proposed_dates, '[]'::jsonb)
      )
    );
  end loop;

  return v_request_id;
end;
$$;

revoke all on function public.request_mission_change(uuid, jsonb, jsonb, jsonb) from public;
grant execute on function public.request_mission_change(uuid, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.respond_to_my_mission_change(
  p_request_id uuid,
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
  v_actor_name text;
  v_pending_count integer;
  v_has_assigned boolean;
  v_assigned_accepted boolean;
  v_any_accepted boolean;
  v_should_apply boolean := false;
  v_date jsonb;
  v_trainer record;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_response not in ('accepted', 'refused') then
    raise exception 'INVALID_RESPONSE';
  end if;

  select rt.*
  into v_target
  from public.mission_change_request_trainers rt
  join public.trainers t on t.id = rt.trainer_id
  where rt.change_request_id = p_request_id
    and t.user_id = auth.uid()
  for update of rt;

  if not found then
    raise exception 'CHANGE_NOT_FOUND';
  end if;

  select * into v_request
  from public.mission_change_requests r
  where r.id = p_request_id
  for update;

  if v_request.status <> 'pending' or v_target.response_status <> 'pending' then
    raise exception 'CHANGE_ALREADY_RESPONDED';
  end if;

  update public.mission_change_request_trainers
  set
    response_status = p_response,
    response_comment = nullif(btrim(coalesce(p_comment, '')), ''),
    responded_at = now()
  where id = v_target.id;

  select nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '')
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
    details
  )
  values (
    v_request.mission_id,
    v_target.trainer_id,
    v_target.mission_formateur_id,
    case when p_response = 'accepted' then 'change_accepted' else 'change_refused' end,
    v_target.previous_status,
    v_target.previous_status,
    auth.uid(),
    'trainer',
    coalesce(v_actor_name, 'Formateur'),
    jsonb_build_object(
      'change_request_id', p_request_id,
      'comment', nullif(btrim(coalesce(p_comment, '')), '')
    )
  );

  -- V2 : la mission est déjà modifiée. La réponse décide uniquement
  -- si l'engagement du formateur reste valable.
  if p_response = 'refused' then
    perform set_config('formaplane.actor_type', 'trainer', true);
    update public.mission_formateurs
    set statut = 'refuse', repondu_le = now(),
        response_comment = nullif(btrim(coalesce(p_comment, '')), ''), affecte_le = null
    where id = v_target.mission_formateur_id;
  end if;

  select count(*) into v_pending_count
  from public.mission_change_request_trainers rt
  where rt.change_request_id = p_request_id and rt.response_status = 'pending';

  if v_pending_count = 0 then
    update public.mission_change_requests
    set status = 'applied', resolved_at = now()
    where id = p_request_id;
  end if;

  perform public.reconcile_trainer_conflicts_safe(v_target.trainer_id);
  return p_response;
end;
$$;

revoke all on function public.respond_to_my_mission_change(uuid, text, text) from public;
grant execute on function public.respond_to_my_mission_change(uuid, text, text) to authenticated;
