-- ============================================================
-- FORMAPLANE
-- Sprint 12.1 — Carnet personnel de contacts OF
--
-- Objectifs :
-- - permettre à chaque formateur de gérer son propre carnet OF ;
-- - isoler strictement les carnets entre formateurs ;
-- - identifier automatiquement, lorsque cela est possible,
--   si l'organisme existe déjà dans Formaplane ;
-- - ne jamais exposer l'annuaire complet des organisations.
-- ============================================================


-- ============================================================
-- 1. NORMALISATION D'UN NOM D'ORGANISME
-- ============================================================

create or replace function public.normalize_organization_name(
  value text
)
returns text
language sql
immutable
as $$
  select lower(
    regexp_replace(
      btrim(
        coalesce(
          value,
          ''
        )
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;


-- ============================================================
-- 2. IDENTIFICATION DU FORMATEUR CONNECTÉ
-- ============================================================

create or replace function public.current_trainer_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id
  from public.trainers t
  where t.user_id = auth.uid()
  limit 1;
$$;


revoke all
on function public.current_trainer_profile_id()
from public;

grant execute
on function public.current_trainer_profile_id()
to authenticated;


-- ============================================================
-- 3. RECHERCHE SÉCURISÉE D'UN ORGANISME FORMAPLANE
--
-- Important :
-- - aucune liste d'organismes n'est exposée ;
-- - seule une correspondance exacte est acceptée ;
-- - les organisations inactives sont ignorées ;
-- - s'il existe plusieurs correspondances, aucune liaison
--   automatique n'est effectuée.
-- ============================================================

create or replace function public.match_active_organization_by_name(
  organization_name text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_normalized_name text;
  v_count integer;
  v_organization_id uuid;
begin

  v_normalized_name :=
    public.normalize_organization_name(
      organization_name
    );


  if v_normalized_name = '' then
    return null;
  end if;


  select count(*)
  into v_count
  from public.organizations o
  where o.status = 'active'
    and (
      public.normalize_organization_name(
        o.name
      ) = v_normalized_name

      or

      public.normalize_organization_name(
        o.legal_name
      ) = v_normalized_name
    );


  if v_count <> 1 then
    return null;
  end if;


  select o.id
  into v_organization_id
  from public.organizations o
  where o.status = 'active'
    and (
      public.normalize_organization_name(
        o.name
      ) = v_normalized_name

      or

      public.normalize_organization_name(
        o.legal_name
      ) = v_normalized_name
    )
  limit 1;


  return v_organization_id;

end;
$$;


-- Cette fonction est utilisée côté serveur par le trigger.
-- Elle n'a pas vocation à servir d'annuaire public.

revoke all
on function public.match_active_organization_by_name(text)
from public;

revoke all
on function public.match_active_organization_by_name(text)
from anon;

revoke all
on function public.match_active_organization_by_name(text)
from authenticated;


-- ============================================================
-- 4. TABLE DU CARNET PERSONNEL
-- ============================================================

create table if not exists
public.trainer_availability_contacts (

  id uuid primary key
    default gen_random_uuid(),


  trainer_id uuid not null
    references public.trainers(id)
    on delete cascade,


  -- Renseigné automatiquement lorsqu'une correspondance
  -- certaine est trouvée dans Formaplane.
  organization_id uuid
    references public.organizations(id)
    on delete set null,


  organization_name text not null,

  contact_name text,

  email text not null,

  phone text,


  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),


  constraint
    trainer_availability_contacts_organization_name_not_blank
  check (
    btrim(
      organization_name
    ) <> ''
  ),


  constraint
    trainer_availability_contacts_email_not_blank
  check (
    btrim(
      email
    ) <> ''
  ),


  constraint
    trainer_availability_contacts_email_format
  check (
    email ~*
    '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);


-- ============================================================
-- 5. INDEX ET UNICITÉ
-- ============================================================

create index if not exists
  trainer_availability_contacts_trainer_idx
on public.trainer_availability_contacts (
  trainer_id
);


create index if not exists
  trainer_availability_contacts_organization_idx
on public.trainer_availability_contacts (
  organization_id
)
where organization_id is not null;


create unique index if not exists
  trainer_availability_contacts_unique_email_idx
on public.trainer_availability_contacts (
  trainer_id,
  lower(email)
);


-- ============================================================
-- 6. NETTOYAGE + MATCH AUTOMATIQUE AVANT ENREGISTREMENT
-- ============================================================

create or replace function
public.prepare_trainer_availability_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- Le propriétaire réel est toujours le formateur connecté.
  -- Le client ne peut donc pas créer un contact
  -- dans le carnet d'un autre formateur.

  new.trainer_id :=
    public.current_trainer_profile_id();


  if new.trainer_id is null then
    raise exception
      'Aucun profil formateur associé au compte connecté.';
  end if;


  new.organization_name :=
    btrim(
      regexp_replace(
        coalesce(
          new.organization_name,
          ''
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    );


  if new.organization_name = '' then
    raise exception
      'Le nom de l''organisme est obligatoire.';
  end if;


  new.contact_name :=
    nullif(
      btrim(
        regexp_replace(
          coalesce(
            new.contact_name,
            ''
          ),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    );


  new.email :=
    lower(
      btrim(
        coalesce(
          new.email,
          ''
        )
      )
    );


  if new.email = '' then
    raise exception
      'L''adresse e-mail est obligatoire.';
  end if;


  new.phone :=
    nullif(
      btrim(
        coalesce(
          new.phone,
          ''
        )
      ),
      ''
    );


  -- organization_id ne vient jamais directement du navigateur.
  -- Il est recalculé côté serveur depuis le nom fourni.

  new.organization_id :=
    public.match_active_organization_by_name(
      new.organization_name
    );


  return new;

end;
$$;


drop trigger if exists
  trainer_availability_contacts_prepare
on public.trainer_availability_contacts;


create trigger
  trainer_availability_contacts_prepare
before insert or update
on public.trainer_availability_contacts
for each row
execute function
  public.prepare_trainer_availability_contact();


-- ============================================================
-- 7. UPDATED_AT
-- ============================================================

drop trigger if exists
  trainer_availability_contacts_set_updated_at
on public.trainer_availability_contacts;


create trigger
  trainer_availability_contacts_set_updated_at
before update
on public.trainer_availability_contacts
for each row
execute function
  public.set_updated_at();


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

alter table
  public.trainer_availability_contacts
enable row level security;


-- ------------------------------------------------------------
-- Lecture
-- ------------------------------------------------------------

drop policy if exists
  "Trainer can read own availability contacts"
on public.trainer_availability_contacts;


create policy
  "Trainer can read own availability contacts"
on public.trainer_availability_contacts
for select
to authenticated
using (
  trainer_id =
    public.current_trainer_profile_id()
);


-- ------------------------------------------------------------
-- Création
-- ------------------------------------------------------------

drop policy if exists
  "Trainer can create own availability contacts"
on public.trainer_availability_contacts;


create policy
  "Trainer can create own availability contacts"
on public.trainer_availability_contacts
for insert
to authenticated
with check (
  trainer_id =
    public.current_trainer_profile_id()
);


-- ------------------------------------------------------------
-- Modification
-- ------------------------------------------------------------

drop policy if exists
  "Trainer can update own availability contacts"
on public.trainer_availability_contacts;


create policy
  "Trainer can update own availability contacts"
on public.trainer_availability_contacts
for update
to authenticated
using (
  trainer_id =
    public.current_trainer_profile_id()
)
with check (
  trainer_id =
    public.current_trainer_profile_id()
);


-- ------------------------------------------------------------
-- Suppression
-- ------------------------------------------------------------

drop policy if exists
  "Trainer can delete own availability contacts"
on public.trainer_availability_contacts;


create policy
  "Trainer can delete own availability contacts"
on public.trainer_availability_contacts
for delete
to authenticated
using (
  trainer_id =
    public.current_trainer_profile_id()
);


-- ============================================================
-- 9. DROITS SQL
-- ============================================================

revoke all
on public.trainer_availability_contacts
from anon;


grant
  select,
  insert,
  update,
  delete
on public.trainer_availability_contacts
to authenticated;


-- ============================================================
-- FIN SPRINT 12.1.1
-- ============================================================
