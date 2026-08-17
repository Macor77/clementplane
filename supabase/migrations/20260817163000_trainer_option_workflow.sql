-- ==========================================================
-- SPRINT 10 — Options formateur / désistement / mission pourvue
-- ==========================================================

create or replace function
public.log_mission_trainer_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mission_id uuid;
  v_trainer_id uuid;
  v_mission_formateur_id uuid;
  v_previous_status text;
  v_new_status text;
  v_action text;

  v_actor_user_id uuid := auth.uid();
  v_actor_type text := 'system';
  v_explicit_actor_type text := null;
  v_actor_display_name text := 'Formaplane';

  v_organization_id uuid;
  v_organization_name text;
begin
  if tg_op = 'DELETE' then
    v_mission_id := old.mission_id;
    v_trainer_id := old.formateur_id;
    v_mission_formateur_id := old.id;
    v_previous_status := old.statut;
    v_new_status := null;
    v_action := 'removed';
  elsif tg_op = 'INSERT' then
    v_mission_id := new.mission_id;
    v_trainer_id := new.formateur_id;
    v_mission_formateur_id := new.id;
    v_previous_status := null;
    v_new_status := new.statut;

    case new.statut
      when 'selectionne' then
        v_action := 'selected';
      when 'proposition_envoyee' then
        v_action := 'proposal_sent';
      when 'accepte' then
        v_action := 'accepted';
      when 'refuse' then
        v_action := 'refused';
      when 'affecte' then
        v_action := 'assigned';
      when 'indisponible_affecte_ailleurs' then
        v_action := 'unavailable_elsewhere';
      when 'annule' then
        v_action := 'cancelled';
      when 'desiste' then
        v_action := 'withdrawn';
      when 'mission_pourvue' then
        v_action := 'mission_filled';
      else
        v_action := 'status_changed';
    end case;
  else
    if new.statut is not distinct from old.statut then
      return new;
    end if;

    v_mission_id := new.mission_id;
    v_trainer_id := new.formateur_id;
    v_mission_formateur_id := new.id;
    v_previous_status := old.statut;
    v_new_status := new.statut;

    case new.statut
      when 'selectionne' then
        v_action := 'reset';
      when 'proposition_envoyee' then
        v_action := 'proposal_sent';
      when 'accepte' then
        v_action := 'accepted';
      when 'refuse' then
        v_action := 'refused';
      when 'affecte' then
        v_action := 'assigned';
      when 'indisponible_affecte_ailleurs' then
        v_action := 'unavailable_elsewhere';
      when 'annule' then
        v_action := 'cancelled';
      when 'desiste' then
        v_action := 'withdrawn';
      when 'mission_pourvue' then
        v_action := 'mission_filled';
      else
        v_action := 'status_changed';
    end case;
  end if;

  select
    m.organization_id,
    o.name
  into
    v_organization_id,
    v_organization_name
  from public.missions m
  left join public.organizations o
    on o.id = m.organization_id
  where m.id = v_mission_id;

  -- Contexte explicite défini par les RPC qui savent réellement
  -- depuis quel espace l'action a été réalisée.
  begin
    v_explicit_actor_type :=
      nullif(
        current_setting(
          'formaplane.actor_type',
          true
        ),
        ''
      );
  exception
    when others then
      v_explicit_actor_type := null;
  end;

  if v_actor_user_id is not null then
    select
      nullif(
        btrim(
          concat_ws(
            ' ',
            p.first_name,
            p.last_name
          )
        ),
        ''
      )
    into v_actor_display_name
    from public.profiles p
    where p.id = v_actor_user_id;
  end if;

  if v_explicit_actor_type in (
    'organization',
    'trainer',
    'system'
  ) then
    v_actor_type :=
      v_explicit_actor_type;

  elsif
    v_actor_user_id is not null
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id =
        v_organization_id
        and om.user_id =
          v_actor_user_id
        and om.status = 'active'
    )
  then
    -- Par défaut, dans le contexte d'une mission appartenant à un OF,
    -- une action authentifiée d'un membre actif de cet OF est attribuée
    -- à l'OF. Cela corrige le cas des doubles casquettes.
    v_actor_type := 'organization';

  elsif
    v_actor_user_id is not null
    and exists (
      select 1
      from public.trainers t
      where t.id = v_trainer_id
        and t.user_id =
          v_actor_user_id
    )
  then
    v_actor_type := 'trainer';

  else
    v_actor_type := 'system';
  end if;

  if
    v_actor_type = 'trainer'
    and v_actor_display_name is null
  then
    select
      nullif(
        btrim(
          concat_ws(
            ' ',
            t.prenom,
            t.nom
          )
        ),
        ''
      )
    into v_actor_display_name
    from public.trainers t
    where t.id = v_trainer_id;
  end if;

  v_actor_display_name :=
    coalesce(
      v_actor_display_name,
      case
        when v_actor_type = 'system'
          then 'Formaplane'
        else 'Utilisateur'
      end
    );

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
    actor_organization_name
  )
  values (
    v_mission_id,
    v_trainer_id,
    v_mission_formateur_id,
    v_action,
    v_previous_status,
    v_new_status,
    v_actor_user_id,
    v_actor_type,
    v_actor_display_name,
    case
      when v_actor_type = 'organization'
        then v_organization_id
      else null
    end,
    case
      when v_actor_type = 'organization'
        then v_organization_name
      else null
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all
on function public.log_mission_trainer_history()
from public;




-- ----------------------------------------------------------
-- Mes propositions : inclut les sorties d'option pour l'historique.
-- ----------------------------------------------------------

create or replace function public.get_my_mission_proposals()
returns table (
  mission_formateur_id uuid,
  mission_id uuid,
  status text,

  proposed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  response_comment text,

  mission_title text,
  formation text,
  client text,

  location text,
  postal_code text,
  city text,

  offered_fee numeric,
  mission_notes text,

  dates jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mf.id as mission_formateur_id,
    mf.mission_id,
    mf.statut as status,

    mf.propose_le as proposed_at,
    mf.repondu_le as responded_at,
    mf.proposal_expires_at as expires_at,
    mf.response_comment,

    coalesce(
      nullif(m.intitule, ''),
      nullif(m.formation, ''),
      nullif(m.client, ''),
      'Mission de formation'
    ) as mission_title,

    m.formation,
    m.client,

    m.lieu as location,
    m.code_postal as postal_code,
    m.ville as city,

    m.cout_formateur as offered_fee,
    m.commentaire as mission_notes,

    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', md.date,
            'heure_debut', md.heure_debut,
            'heure_fin', md.heure_fin
          )
          order by md.date
        )
        from public.mission_dates md
        where md.mission_id = m.id
      ),
      '[]'::jsonb
    ) as dates

  from public.mission_formateurs mf

  join public.trainers t
    on t.id = mf.formateur_id

  join public.missions m
    on m.id = mf.mission_id

  where t.user_id = auth.uid()

    and mf.statut in (
      'proposition_envoyee',
      'accepte',
      'refuse',
      'affecte',
      'indisponible_affecte_ailleurs',
      'annule',
      'desiste',
      'mission_pourvue'
    )

  order by
    coalesce(mf.propose_le, mf.created_at) desc;
$$;

revoke all
on function public.get_my_mission_proposals()
from public;

grant execute
on function public.get_my_mission_proposals()
to authenticated;


-- ----------------------------------------------------------
-- Désistement d'une option par le formateur.
-- Disponible uniquement tant que le statut est "accepte".
-- Les disponibilités des dates concernées sont remises à :
--   dispo / indispo / neutre ('') selon le choix fourni.
-- Sans choix explicite, le statut neutre est appliqué.
-- ----------------------------------------------------------

create or replace function public.withdraw_from_my_mission_option(
  p_mission_formateur_id uuid,
  p_availability_by_day jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer_id uuid;
  v_mission_id uuid;
  v_status text;
  v_day record;
  v_day_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    mf.formateur_id,
    mf.mission_id,
    mf.statut
  into
    v_trainer_id,
    v_mission_id,
    v_status
  from public.mission_formateurs mf
  join public.trainers t
    on t.id = mf.formateur_id
  where mf.id = p_mission_formateur_id
    and t.user_id = auth.uid()
  for update of mf;

  if not found then
    raise exception 'OPTION_NOT_FOUND';
  end if;

  if v_status <> 'accepte' then
    raise exception 'WITHDRAWAL_NOT_ALLOWED';
  end if;

  perform set_config(
    'formaplane.actor_type',
    'trainer',
    true
  );

  update public.mission_formateurs
  set
    statut = 'desiste',
    affecte_le = null
  where id = p_mission_formateur_id;

  for v_day in
    select md.date
    from public.mission_dates md
    where md.mission_id = v_mission_id
    order by md.date
  loop
    v_day_status := coalesce(
      p_availability_by_day ->> v_day.date::text,
      ''
    );

    if v_day_status not in ('', 'dispo', 'indispo') then
      v_day_status := '';
    end if;

    insert into public.trainer_availability (
      trainer_id,
      day,
      status,
      updated_at
    )
    values (
      v_trainer_id,
      v_day.date,
      v_day_status,
      now()
    )
    on conflict (trainer_id, day)
    do update
    set
      status = excluded.status,
      updated_at = excluded.updated_at;
  end loop;

  return true;
end;
$$;

revoke all
on function public.withdraw_from_my_mission_option(uuid, jsonb)
from public;

grant execute
on function public.withdraw_from_my_mission_option(uuid, jsonb)
to authenticated;
