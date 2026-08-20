-- ============================================================
-- FORMAPLANE
-- Sprint 12.1.3 — Statut de référencement du formateur chez l'OF
--
-- Un formateur peut savoir uniquement si l'organisation associée
-- à chacun de SES contacts l'a déjà ajouté à son réseau.
--
-- Aucune donnée privée de organization_trainers (tarif, notes,
-- statut interne, etc.) n'est exposée.
-- ============================================================

create or replace function public.get_my_availability_contact_reference_status()
returns table (
  contact_id uuid,
  is_referenced boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as contact_id,
    case
      when c.organization_id is null then false
      else exists (
        select 1
        from public.organization_trainers ot
        where ot.organization_id = c.organization_id
          and ot.trainer_id = c.trainer_id
      )
    end as is_referenced
  from public.trainer_availability_contacts c
  where c.trainer_id = public.current_trainer_profile_id();
$$;

revoke all
on function public.get_my_availability_contact_reference_status()
from public;

revoke all
on function public.get_my_availability_contact_reference_status()
from anon;

grant execute
on function public.get_my_availability_contact_reference_status()
to authenticated;
