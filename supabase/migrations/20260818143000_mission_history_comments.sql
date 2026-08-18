-- ==========================================================
-- SPRINT 10 — Commentaires rattachés aux événements d'historique
-- ==========================================================
-- Les commentaires d'acceptation/refus/désistement doivent être lus
-- dans le contexte de l'action correspondante, et non comme un
-- "commentaire courant" ambigu.

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
  v_details jsonb := '{}'::jsonb;

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
      when 'selectionne' then v_action := 'selected';
      when 'proposition_envoyee' then v_action := 'proposal_sent';
      when 'accepte' then v_action := 'accepted';
      when 'refuse' then v_action := 'refused';
      when 'affecte' then v_action := 'assigned';
      when 'indisponible_affecte_ailleurs' then v_action := 'unavailable_elsewhere';
      when 'annule' then v_action := 'cancelled';
      when 'desiste' then v_action := 'withdrawn';
      when 'mission_pourvue' then v_action := 'mission_filled';
      else v_action := 'status_changed';
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
      when 'selectionne' then v_action := 'reset';
      when 'proposition_envoyee' then v_action := 'proposal_sent';
      when 'accepte' then v_action := 'accepted';
      when 'refuse' then v_action := 'refused';
      when 'affecte' then v_action := 'assigned';
      when 'indisponible_affecte_ailleurs' then v_action := 'unavailable_elsewhere';
      when 'annule' then v_action := 'cancelled';
      when 'desiste' then v_action := 'withdrawn';
      when 'mission_pourvue' then v_action := 'mission_filled';
      else v_action := 'status_changed';
    end case;
  end if;

  if tg_op <> 'DELETE' then
    if v_action in ('accepted', 'refused') then
      v_details := jsonb_build_object(
        'comment', nullif(btrim(coalesce(new.response_comment, '')), '')
      );
    elsif v_action = 'withdrawn' then
      v_details := jsonb_build_object(
        'comment', nullif(btrim(coalesce(new.withdrawal_comment, '')), '')
      );
    end if;
  end if;

  select m.organization_id, o.name
  into v_organization_id, v_organization_name
  from public.missions m
  left join public.organizations o on o.id = m.organization_id
  where m.id = v_mission_id;

  begin
    v_explicit_actor_type := nullif(current_setting('formaplane.actor_type', true), '');
  exception when others then
    v_explicit_actor_type := null;
  end;

  if v_actor_user_id is not null then
    select nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), '')
    into v_actor_display_name
    from public.profiles p
    where p.id = v_actor_user_id;
  end if;

  if v_explicit_actor_type in ('organization', 'trainer', 'system') then
    v_actor_type := v_explicit_actor_type;
  elsif v_actor_user_id is not null and exists (
    select 1 from public.organization_members om
    where om.organization_id = v_organization_id
      and om.user_id = v_actor_user_id
      and om.status = 'active'
  ) then
    v_actor_type := 'organization';
  elsif v_actor_user_id is not null and exists (
    select 1 from public.trainers t
    where t.id = v_trainer_id
      and t.user_id = v_actor_user_id
  ) then
    v_actor_type := 'trainer';
  else
    v_actor_type := 'system';
  end if;

  if v_actor_type = 'trainer' and v_actor_display_name is null then
    select nullif(btrim(concat_ws(' ', t.prenom, t.nom)), '')
    into v_actor_display_name
    from public.trainers t
    where t.id = v_trainer_id;
  end if;

  v_actor_display_name := coalesce(
    v_actor_display_name,
    case when v_actor_type = 'system' then 'Formaplane' else 'Utilisateur' end
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
    actor_organization_name,
    details
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
    case when v_actor_type = 'organization' then v_organization_id else null end,
    case when v_actor_type = 'organization' then v_organization_name else null end,
    v_details
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.log_mission_trainer_history() from public;
