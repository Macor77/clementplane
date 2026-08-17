-- ==========================================================
-- SPRINT 10 — Correctif attribution auteur historique mission
-- Gère correctement les comptes à double casquette OF / Formateur.
--
-- Principe :
-- 1) Les actions réalisées depuis l'espace OF sont considérées comme
--    des actions "organization" si l'utilisateur est membre actif
--    de l'OF propriétaire de la mission.
-- 2) Les réponses réellement effectuées par le formateur via le moteur
--    de réponse dédié sont explicitement marquées comme "trainer"
--    grâce à un contexte transactionnel temporaire.
-- ==========================================================

-- ----------------------------------------------------------
-- 1. Le trigger d'historique lit désormais un contexte explicite
--    "formaplane.actor_type" lorsqu'il est fourni.
-- ----------------------------------------------------------

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
-- 2. Réponse depuis l'espace Formateur :
--    on marque explicitement l'acteur comme "trainer"
--    juste avant d'appeler le moteur existant.
-- ----------------------------------------------------------

create or replace function public.respond_to_my_mission_proposal(
  p_mission_formateur_id uuid,
  p_response text,
  p_comment text default ''
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_token uuid;
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_response not in (
    'accepte',
    'refuse'
  ) then
    raise exception 'INVALID_RESPONSE';
  end if;

  select mf.proposal_token
  into current_token
  from public.mission_formateurs mf
  join public.trainers t
    on t.id = mf.formateur_id
  where mf.id =
    p_mission_formateur_id
    and t.user_id = auth.uid()
  limit 1;

  if current_token is null then
    raise exception
      'PROPOSAL_NOT_FOUND';
  end if;

  -- Contexte transactionnel local uniquement à cet appel.
  perform set_config(
    'formaplane.actor_type',
    'trainer',
    true
  );

  perform public.respond_to_mission_proposal(
    current_token,
    p_response,
    coalesce(
      p_comment,
      ''
    )
  );

  return true;

end;
$$;

revoke all
on function public.respond_to_my_mission_proposal(
  uuid,
  text,
  text
)
from public;

grant execute
on function public.respond_to_my_mission_proposal(
  uuid,
  text,
  text
)
to authenticated;


-- ----------------------------------------------------------
-- 3. Réponse via le lien public :
--    si le formateur n'est pas authentifié, l'acteur reste "system".
--    Si un utilisateur authentifié est bien le formateur concerné,
--    on force "trainer".
-- ----------------------------------------------------------

create or replace function public.respond_to_mission_proposal(
  p_token uuid,
  p_response text,
  p_comment text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_expires_at timestamptz;
  v_trainer_user_id uuid;
begin
  if p_response not in (
    'accepte',
    'refuse'
  ) then
    raise exception
      'Réponse invalide.';
  end if;

  select
    mf.statut,
    mf.proposal_expires_at,
    t.user_id
  into
    v_status,
    v_expires_at,
    v_trainer_user_id
  from public.mission_formateurs mf
  join public.trainers t
    on t.id = mf.formateur_id
  where mf.proposal_token = p_token
  for update of mf;

  if not found then
    raise exception
      'Proposition introuvable.';
  end if;

  if
    v_expires_at is not null
    and v_expires_at < now()
  then
    raise exception
      'Cette proposition a expiré.';
  end if;

  if
    v_status <>
    'proposition_envoyee'
  then
    raise exception
      'Une réponse a déjà été enregistrée pour cette proposition.';
  end if;

  /*
   * Si l'utilisateur authentifié est bien
   * le formateur concerné, on force le
   * contexte "trainer".
   *
   * Pour un lien public anonyme, aucun
   * utilisateur authentifié n'est disponible :
   * l'auteur restera "system".
   */
  if
    auth.uid() is not null
    and v_trainer_user_id =
      auth.uid()
  then
    perform set_config(
      'formaplane.actor_type',
      'trainer',
      true
    );
  end if;

  update public.mission_formateurs
  set
    statut = p_response,
    repondu_le = now(),
    response_comment =
      nullif(
        trim(p_comment),
        ''
      ),
    commentaire =
      coalesce(
        nullif(
          trim(p_comment),
          ''
        ),
        commentaire
      ),
    affecte_le = null
  where proposal_token = p_token;

  return p_response;
end;
$$;


grant execute on function public.respond_to_mission_proposal(uuid, text, text) to anon, authenticated;
