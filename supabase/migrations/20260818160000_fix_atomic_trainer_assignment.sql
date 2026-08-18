-- Sprint 10 — Correctif affectation atomique
-- Autorise les statuts ajoutés par le workflow options/historique et garantit
-- qu'une affectation + clôture des autres propositions est transactionnelle.

alter table public.mission_formateurs
  drop constraint if exists mission_formateurs_statut_check;

alter table public.mission_formateurs
  add constraint mission_formateurs_statut_check
  check (
    statut in (
      'selectionne',
      'proposition_envoyee',
      'accepte',
      'refuse',
      'affecte',
      'indisponible_affecte_ailleurs',
      'annule',
      'desiste',
      'mission_pourvue'
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
begin
  -- Le formateur choisi doit avoir une option acceptée (ou être déjà affecté).
  if not exists (
    select 1
    from public.mission_formateurs mf
    where mf.mission_id = p_mission_id
      and mf.formateur_id = p_formateur_id
      and mf.statut in ('accepte', 'affecte')
  ) then
    raise exception 'Le formateur doit avoir accepté la mission avant son affectation.';
  end if;

  -- Ferme toutes les autres propositions/options encore actives sur cette mission.
  update public.mission_formateurs
  set statut = 'mission_pourvue',
      affecte_le = null
  where mission_id = p_mission_id
    and formateur_id <> p_formateur_id
    and statut in ('selectionne', 'proposition_envoyee', 'accepte', 'affecte');

  -- Confirme le formateur choisi.
  update public.mission_formateurs
  set statut = 'affecte',
      affecte_le = now()
  where mission_id = p_mission_id
    and formateur_id = p_formateur_id;

  return query
  select mf.*
  from public.mission_formateurs mf
  where mf.mission_id = p_mission_id
    and mf.formateur_id = p_formateur_id;
end;
$$;

grant execute on function public.assign_mission_trainer(uuid, uuid) to authenticated;
