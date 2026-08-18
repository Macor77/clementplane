-- ==========================================================
-- SPRINT 10 — Revalidation des conditions essentielles
-- + historique exhaustif des propositions formateur
-- ==========================================================

create table if not exists public.mission_change_requests (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'refused', 'cancelled')),
  previous_mission jsonb not null default '{}'::jsonb,
  proposed_mission jsonb not null default '{}'::jsonb,
  previous_dates jsonb not null default '[]'::jsonb,
  proposed_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists mission_change_requests_one_pending_idx
  on public.mission_change_requests (mission_id)
  where status = 'pending';

create table if not exists public.mission_change_request_trainers (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null
    references public.mission_change_requests(id) on delete cascade,
  mission_formateur_id uuid,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  previous_status text not null,
  response_status text not null default 'pending'
    check (response_status in ('pending', 'accepted', 'refused')),
  response_comment text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (change_request_id, mission_formateur_id)
);

create index if not exists mission_change_request_trainers_trainer_idx
  on public.mission_change_request_trainers (trainer_id, created_at desc);

alter table public.mission_change_requests enable row level security;
alter table public.mission_change_request_trainers enable row level security;

-- Lecture/écriture exclusivement via les RPC SECURITY DEFINER ci-dessous.
revoke all on public.mission_change_requests from public;
revoke all on public.mission_change_request_trainers from public;


-- ----------------------------------------------------------
-- OF : proposer une modification essentielle.
-- Les champs non essentiels sont enregistrés immédiatement.
-- Les conditions essentielles restent inchangées jusqu'à validation.
-- ----------------------------------------------------------
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
    statut = coalesce(nullif(p_immediate_changes ->> 'statut', ''), m.statut)
  where m.id = p_mission_id;

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


-- ----------------------------------------------------------
-- OF : consulter la modification en attente et les réponses.
-- ----------------------------------------------------------
create or replace function public.get_pending_mission_change_for_organization(
  p_mission_id uuid
)
returns table (
  request_id uuid,
  request_status text,
  created_at timestamptz,
  previous_mission jsonb,
  proposed_mission jsonb,
  previous_dates jsonb,
  proposed_dates jsonb,
  trainer_responses jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.missions m
    join public.organization_members om on om.organization_id = m.organization_id
    where m.id = p_mission_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    r.id,
    r.status,
    r.created_at,
    r.previous_mission,
    r.proposed_mission,
    r.previous_dates,
    r.proposed_dates,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'trainer_id', rt.trainer_id,
          'mission_formateur_id', rt.mission_formateur_id,
          'previous_status', rt.previous_status,
          'response_status', rt.response_status,
          'response_comment', rt.response_comment,
          'responded_at', rt.responded_at,
          'trainer_name', btrim(concat_ws(' ', tr.prenom, tr.nom))
        ) order by tr.nom, tr.prenom
      )
      from public.mission_change_request_trainers rt
      join public.trainers tr on tr.id = rt.trainer_id
      where rt.change_request_id = r.id
    ), '[]'::jsonb)
  from public.mission_change_requests r
  where r.mission_id = p_mission_id
    and r.status = 'pending'
  order by r.created_at desc
  limit 1;
end;
$$;

revoke all on function public.get_pending_mission_change_for_organization(uuid) from public;
grant execute on function public.get_pending_mission_change_for_organization(uuid) to authenticated;


-- ----------------------------------------------------------
-- Formateur : consulter la modification qui le concerne.
-- ----------------------------------------------------------
create or replace function public.get_my_pending_mission_change(
  p_mission_id uuid
)
returns table (
  request_id uuid,
  request_status text,
  created_at timestamptz,
  previous_status text,
  response_status text,
  response_comment text,
  previous_mission jsonb,
  proposed_mission jsonb,
  previous_dates jsonb,
  proposed_dates jsonb,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.status,
    r.created_at,
    rt.previous_status,
    rt.response_status,
    rt.response_comment,
    r.previous_mission,
    r.proposed_mission,
    r.previous_dates,
    r.proposed_dates,
    o.name
  from public.mission_change_requests r
  join public.mission_change_request_trainers rt
    on rt.change_request_id = r.id
  join public.trainers t
    on t.id = rt.trainer_id
  left join public.organizations o
    on o.id = r.organization_id
  where r.mission_id = p_mission_id
    and r.status = 'pending'
    and t.user_id = auth.uid()
  order by r.created_at desc
  limit 1;
$$;

revoke all on function public.get_my_pending_mission_change(uuid) from public;
grant execute on function public.get_my_pending_mission_change(uuid) to authenticated;


-- ----------------------------------------------------------
-- Formateur : accepter/refuser les nouvelles conditions.
-- ----------------------------------------------------------
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

  -- Une option qui refuse les nouvelles conditions quitte la mission.
  -- Une mission déjà affectée reste confirmée selon ses anciennes conditions.
  if p_response = 'refused' and v_target.previous_status = 'accepte' then
    perform set_config('formaplane.actor_type', 'trainer', true);

    update public.mission_formateurs
    set
      statut = 'refuse',
      repondu_le = now(),
      response_comment = nullif(btrim(coalesce(p_comment, '')), ''),
      affecte_le = null
    where id = v_target.mission_formateur_id;
  end if;

  select count(*)
  into v_pending_count
  from public.mission_change_request_trainers rt
  where rt.change_request_id = p_request_id
    and rt.response_status = 'pending';

  if v_pending_count = 0 then
    select exists (
      select 1 from public.mission_change_request_trainers rt
      where rt.change_request_id = p_request_id
        and rt.previous_status = 'affecte'
    ) into v_has_assigned;

    select exists (
      select 1 from public.mission_change_request_trainers rt
      where rt.change_request_id = p_request_id
        and rt.previous_status = 'affecte'
        and rt.response_status = 'accepted'
    ) into v_assigned_accepted;

    select exists (
      select 1 from public.mission_change_request_trainers rt
      where rt.change_request_id = p_request_id
        and rt.response_status = 'accepted'
    ) into v_any_accepted;

    v_should_apply := case
      when v_has_assigned then v_assigned_accepted
      else v_any_accepted
    end;

    if v_should_apply then
      update public.missions m
      set
        formation = nullif(btrim(coalesce(v_request.proposed_mission ->> 'formation', '')), ''),
        lieu = coalesce(v_request.proposed_mission ->> 'lieu', ''),
        adresse = nullif(btrim(coalesce(v_request.proposed_mission ->> 'adresse', '')), ''),
        code_postal = nullif(btrim(coalesce(v_request.proposed_mission ->> 'code_postal', '')), ''),
        ville = nullif(btrim(coalesce(v_request.proposed_mission ->> 'ville', '')), ''),
        cout_formateur = case
          when nullif(v_request.proposed_mission ->> 'cout_formateur', '') is null then null
          else (v_request.proposed_mission ->> 'cout_formateur')::numeric
        end
      where m.id = v_request.mission_id;

      delete from public.mission_dates
      where mission_id = v_request.mission_id;

      for v_date in
        select value from jsonb_array_elements(v_request.proposed_dates)
      loop
        insert into public.mission_dates (
          mission_id,
          date,
          heure_debut,
          heure_fin
        ) values (
          v_request.mission_id,
          (v_date ->> 'date')::date,
          coalesce(nullif(v_date ->> 'heure_debut', ''), '09:00')::time,
          coalesce(nullif(v_date ->> 'heure_fin', ''), '17:00')::time
        );
      end loop;

      update public.mission_change_requests
      set status = 'applied', resolved_at = now()
      where id = p_request_id;

      for v_trainer in
        select distinct rt.trainer_id
        from public.mission_change_request_trainers rt
        where rt.change_request_id = p_request_id
      loop
        perform public.reconcile_trainer_conflicts_safe(v_trainer.trainer_id);

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
        select
          v_request.mission_id,
          rt.trainer_id,
          rt.mission_formateur_id,
          'change_applied',
          rt.previous_status,
          mf.statut,
          'system',
          'Formaplane',
          jsonb_build_object('change_request_id', p_request_id)
        from public.mission_change_request_trainers rt
        left join public.mission_formateurs mf on mf.id = rt.mission_formateur_id
        where rt.change_request_id = p_request_id
          and rt.trainer_id = v_trainer.trainer_id;
      end loop;
    else
      update public.mission_change_requests
      set status = 'refused', resolved_at = now()
      where id = p_request_id;
    end if;
  end if;

  return p_response;
end;
$$;

revoke all on function public.respond_to_my_mission_change(uuid, text, text) from public;
grant execute on function public.respond_to_my_mission_change(uuid, text, text) to authenticated;


-- ----------------------------------------------------------
-- Historique exhaustif des propositions du formateur.
-- Inclut les relations supprimées par l'OF dès lors qu'une
-- proposition avait effectivement été envoyée.
-- ----------------------------------------------------------
create or replace function public.get_my_mission_proposal_history()
returns table (
  mission_formateur_id uuid,
  mission_id uuid,
  status text,
  proposed_at timestamptz,
  responded_at timestamptz,
  response_comment text,
  withdrawal_comment text,
  mission_title text,
  formation text,
  client text,
  location text,
  postal_code text,
  city text,
  offered_fee numeric,
  mission_notes text,
  organization_id uuid,
  organization_name text,
  dates jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select t.id as trainer_id
    from public.trainers t
    where t.user_id = auth.uid()
  ),
  relation_events as (
    select
      h.mission_formateur_id,
      h.mission_id,
      h.trainer_id,
      min(h.created_at) filter (where h.action = 'proposal_sent') as proposed_at,
      max(h.created_at) as last_event_at,
      (array_agg(h.action order by h.created_at desc))[1] as last_action,
      (array_agg(h.new_status order by h.created_at desc))[1] as last_new_status,
      bool_or(h.action = 'proposal_sent') as was_proposed
    from public.mission_trainer_history h
    join mine on mine.trainer_id = h.trainer_id
    where h.mission_formateur_id is not null
    group by h.mission_formateur_id, h.mission_id, h.trainer_id
  )
  select
    re.mission_formateur_id,
    re.mission_id,
    case
      when mf.id is null then 'retire_par_of'
      else mf.statut
    end as status,
    coalesce(mf.propose_le, re.proposed_at),
    coalesce(mf.repondu_le, re.last_event_at),
    mf.response_comment,
    mf.withdrawal_comment,
    coalesce(
      nullif(m.intitule, ''),
      nullif(m.formation, ''),
      nullif(m.client, ''),
      'Mission de formation'
    ),
    m.formation,
    m.client,
    m.lieu,
    m.code_postal,
    m.ville,
    m.cout_formateur,
    m.commentaire,
    o.id,
    o.name,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', md.date,
          'heure_debut', md.heure_debut,
          'heure_fin', md.heure_fin
        ) order by md.date
      )
      from public.mission_dates md
      where md.mission_id = re.mission_id
    ), '[]'::jsonb)
  from relation_events re
  join public.missions m on m.id = re.mission_id
  left join public.organizations o on o.id = m.organization_id
  left join public.mission_formateurs mf on mf.id = re.mission_formateur_id
  where re.was_proposed = true
    and (
      mf.id is null
      or mf.statut not in ('selectionne', 'proposition_envoyee', 'accepte', 'affecte')
    )
  order by coalesce(mf.repondu_le, re.last_event_at) desc;
$$;

revoke all on function public.get_my_mission_proposal_history() from public;
grant execute on function public.get_my_mission_proposal_history() to authenticated;
