-- ============================================================
-- TimeForma
-- Relation privée Organisme <-> Formateur
--
-- Objectif :
-- - trainers = fiche professionnelle globale
-- - organization_trainers = données privées propres à chaque OF
--
-- Les anciennes colonnes statut / tarif / notes de trainers
-- sont conservées temporairement pour assurer une migration
-- progressive sans casser l'existant.
-- ============================================================


-- ============================================================
-- 1. TABLE
-- ============================================================

create table if not exists public.organization_trainers (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  trainer_id uuid not null
    references public.trainers(id)
    on delete cascade,

  statut text not null default 'Inactif',

  tarif numeric,

  notes text,

  created_by_user_id uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint organization_trainers_unique
    unique (
      organization_id,
      trainer_id
    )
);


-- ============================================================
-- 2. INDEX
-- ============================================================

create index if not exists
  organization_trainers_organization_idx
on public.organization_trainers (
  organization_id
);


create index if not exists
  organization_trainers_trainer_idx
on public.organization_trainers (
  trainer_id
);


create index if not exists
  organization_trainers_status_idx
on public.organization_trainers (
  organization_id,
  statut
);


-- ============================================================
-- 3. UPDATED_AT
-- ============================================================

drop trigger if exists
  organization_trainers_set_updated_at
on public.organization_trainers;


create trigger
  organization_trainers_set_updated_at
before update
on public.organization_trainers
for each row
execute function public.set_updated_at();


-- ============================================================
-- 4. RLS
-- ============================================================

alter table public.organization_trainers
enable row level security;


-- ------------------------------------------------------------
-- Lecture
-- Un utilisateur ne voit que les relations
-- appartenant à ses propres organismes.
-- ------------------------------------------------------------

drop policy if exists
  "Organization members can read organization trainers"
on public.organization_trainers;


create policy
  "Organization members can read organization trainers"
on public.organization_trainers
for select
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
);


-- ------------------------------------------------------------
-- Création d'un rattachement
-- ------------------------------------------------------------

drop policy if exists
  "Organization members can add trainers"
on public.organization_trainers;


create policy
  "Organization members can add trainers"
on public.organization_trainers
for insert
to authenticated
with check (
  public.is_organization_member(
    organization_id
  )
);


-- ------------------------------------------------------------
-- Modification des données privées OF
-- ------------------------------------------------------------

drop policy if exists
  "Organization members can update organization trainers"
on public.organization_trainers;


create policy
  "Organization members can update organization trainers"
on public.organization_trainers
for update
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
)
with check (
  public.is_organization_member(
    organization_id
  )
);


-- ------------------------------------------------------------
-- Retrait du réseau
-- IMPORTANT :
-- cela supprime uniquement la relation OF / formateur.
-- La fiche globale trainers n'est pas supprimée.
-- ------------------------------------------------------------

drop policy if exists
  "Organization members can remove trainers"
on public.organization_trainers;


create policy
  "Organization members can remove trainers"
on public.organization_trainers
for delete
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
);


-- ============================================================
-- 5. MIGRATION DES DONNÉES EXISTANTES
--
-- TimeForma n'a actuellement qu'un réseau OF historique.
--
-- Par sécurité :
-- - s'il existe exactement 1 organisation active,
--   tous les formateurs actuels lui sont rattachés ;
-- - s'il y en a 0 ou plusieurs, aucune migration automatique
--   n'est faite.
--
-- Cela évite d'attribuer accidentellement des formateurs
-- au mauvais organisme.
-- ============================================================

do $$
declare
  v_organization_id uuid;
  v_active_organization_count integer;
begin

  select count(*)
  into v_active_organization_count
  from public.organizations
  where status = 'active';


  if v_active_organization_count = 1 then

    select id
    into v_organization_id
    from public.organizations
    where status = 'active'
    limit 1;


    insert into public.organization_trainers (
      organization_id,
      trainer_id,
      statut,
      tarif,
      notes
    )

    select
      v_organization_id,
      t.id,
      coalesce(
        nullif(
          btrim(t.statut),
          ''
        ),
        'Inactif'
      ),
      t.tarif,
      t.notes

    from public.trainers t

    on conflict (
      organization_id,
      trainer_id
    )
    do nothing;


    raise notice
      'Migration organization_trainers réalisée pour organisation %',
      v_organization_id;

  else

    raise notice
      'Migration automatique ignorée : % organisations actives trouvées.',
      v_active_organization_count;

  end if;

end;
$$;