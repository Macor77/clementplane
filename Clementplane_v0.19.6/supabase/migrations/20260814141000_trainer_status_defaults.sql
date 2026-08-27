-- ==========================================================
-- SPRINT 10.1 — STATUTS FORMATEURS
-- Standard par défaut + renommage Black -> Exclu
-- ==========================================================

-- Les nouvelles relations OF / formateur sont désormais Standard
-- par défaut. Les relations existantes restent inchangées.
alter table public.organization_trainers
  alter column statut set default 'Standard';

-- Renommage du statut d'exclusion dans les données existantes.
update public.organization_trainers
set statut = 'Exclu'
where statut = 'Black';

-- trainers.statut est une ancienne donnée globale encore conservée
-- pour compatibilité. On la renomme également afin d'éviter que
-- l'ancien libellé réapparaisse dans un écran ou un outil historique.
update public.trainers
set statut = 'Exclu'
where statut = 'Black';

-- Ajout d'un formateur déjà présent sur Formaplane au réseau d'un OF :
-- la nouvelle relation démarre automatiquement en Standard.
create or replace function public.add_trainer_to_my_organization(
  p_organization_id uuid,
  p_trainer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_relation_id uuid;
begin
  if not public.is_organization_member(p_organization_id) then
    raise exception 'Vous ne pouvez pas modifier cet organisme.';
  end if;

  if not exists (
    select 1
    from public.trainers
    where id = p_trainer_id
  ) then
    raise exception 'Formateur introuvable.';
  end if;

  insert into public.organization_trainers (
    organization_id,
    trainer_id,
    statut,
    tarif,
    notes
  )
  values (
    p_organization_id,
    p_trainer_id,
    'Standard',
    null,
    null
  )
  on conflict (organization_id, trainer_id)
  do update set
    updated_at = now()
  returning id
  into v_relation_id;

  return v_relation_id;
end;
$$;

revoke all
on function public.add_trainer_to_my_organization(uuid, uuid)
from public;

grant execute
on function public.add_trainer_to_my_organization(uuid, uuid)
to authenticated;
