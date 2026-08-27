-- ==========================================================
-- RECHERCHE GLOBALE DE FORMATEURS POUR UN OF
-- ==========================================================
-- Objectif :
-- - permettre à un membre actif d'un OF de rechercher les
--   formateurs TimeForma par nom, prénom ou e-mail ;
-- - ne jamais exposer statut, tarif ou notes d'un autre OF ;
-- - permettre l'ajout au réseau de l'OF actif.
-- ==========================================================

create or replace function public.search_trainers_for_organization(
  p_organization_id uuid,
  p_query text
)
returns table (
  id uuid,
  prenom text,
  nom text,
  ville text,
  code_postal text,
  email text,
  already_in_network boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.prenom,
    t.nom,
    t.ville,
    t.code_postal,
    t.email,
    exists (
      select 1
      from public.organization_trainers ot
      where ot.organization_id = p_organization_id
        and ot.trainer_id = t.id
    ) as already_in_network
  from public.trainers t
  where
    public.is_organization_member(p_organization_id)
    and length(btrim(coalesce(p_query, ''))) >= 2
    and (
      t.prenom ilike '%' || btrim(p_query) || '%'
      or t.nom ilike '%' || btrim(p_query) || '%'
      or t.email ilike '%' || btrim(p_query) || '%'
      or concat_ws(' ', t.prenom, t.nom)
           ilike '%' || btrim(p_query) || '%'
      or concat_ws(' ', t.nom, t.prenom)
           ilike '%' || btrim(p_query) || '%'
    )
  order by
    lower(coalesce(t.nom, '')),
    lower(coalesce(t.prenom, ''))
  limit 30;
$$;


revoke all
on function public.search_trainers_for_organization(uuid, text)
from public;

grant execute
on function public.search_trainers_for_organization(uuid, text)
to authenticated;


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
    'Inactif',
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
