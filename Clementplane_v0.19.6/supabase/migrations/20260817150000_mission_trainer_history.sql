-- ==========================================================
-- SPRINT 10 — Historique des actions formateurs / missions
-- Traçabilité OF / Formateur / Système
-- ==========================================================

create table if not exists public.mission_trainer_history (
  id uuid primary key default gen_random_uuid(),

  mission_id uuid not null
    references public.missions(id)
    on delete cascade,

  trainer_id uuid not null
    references public.trainers(id)
    on delete cascade,

  -- Valeur historique volontairement sans FK :
  -- l'association mission_formateurs peut être supprimée
  -- alors que l'événement doit rester lisible.
  mission_formateur_id uuid,

  action text not null,

  previous_status text,
  new_status text,

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  actor_type text not null
    check (
      actor_type in (
        'organization',
        'trainer',
        'system'
      )
    ),

  -- Snapshots conservés pour que l'historique reste compréhensible
  -- même si le compte utilisateur est ensuite supprimé.
  actor_display_name text,

  actor_organization_id uuid
    references public.organizations(id)
    on delete set null,

  actor_organization_name text,

  details jsonb not null
    default '{}'::jsonb,

  created_at timestamptz not null
    default now()
);

create index if not exists mission_trainer_history_mission_idx
  on public.mission_trainer_history (
    mission_id,
    created_at desc
  );

create index if not exists mission_trainer_history_trainer_idx
  on public.mission_trainer_history (
    trainer_id,
    created_at desc
  );

alter table public.mission_trainer_history
  enable row level security;

-- Lecture OF : uniquement les membres actifs de l'OF propriétaire
-- de la mission.
drop policy if exists
  "mission_trainer_history_select_organization"
on public.mission_trainer_history;

create policy
  "mission_trainer_history_select_organization"
on public.mission_trainer_history
for select
to authenticated
using (
  exists (
    select 1
    from public.missions m
    join public.organization_members om
      on om.organization_id = m.organization_id
    where m.id = mission_trainer_history.mission_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

-- Lecture Formateur : le formateur peut consulter l'historique
-- qui concerne sa propre fiche revendiquée.
drop policy if exists
  "mission_trainer_history_select_trainer"
on public.mission_trainer_history;

create policy
  "mission_trainer_history_select_trainer"
on public.mission_trainer_history
for select
to authenticated
using (
  exists (
    select 1
    from public.trainers t
    where t.id = mission_trainer_history.trainer_id
      and t.user_id = auth.uid()
  )
);

-- Aucun INSERT/UPDATE/DELETE direct n'est accordé aux utilisateurs.
-- L'alimentation se fait exclusivement via le trigger ci-dessous.

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
    -- UPDATE : on ne journalise que les changements de statut.
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

    if exists (
      select 1
      from public.trainers t
      where t.id = v_trainer_id
        and t.user_id = v_actor_user_id
    ) then
      v_actor_type := 'trainer';

      if v_actor_display_name is null then
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

    elsif exists (
      select 1
      from public.organization_members om
      where om.organization_id = v_organization_id
        and om.user_id = v_actor_user_id
        and om.status = 'active'
    ) then
      v_actor_type := 'organization';

    else
      v_actor_type := 'system';
    end if;
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

drop trigger if exists
  mission_trainer_history_status_trigger
on public.mission_formateurs;

create trigger
  mission_trainer_history_status_trigger
after insert or update of statut or delete
on public.mission_formateurs
for each row
execute function
  public.log_mission_trainer_history();

revoke all
on function public.log_mission_trainer_history()
from public;
