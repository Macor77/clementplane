-- ============================================================
-- TimeForma
-- Historique des modifications de disponibilités formateurs
-- ============================================================


-- ------------------------------------------------------------
-- 1. Table d'historique
-- ------------------------------------------------------------

create table if not exists public.trainer_availability_history (
  id uuid primary key default gen_random_uuid(),

  trainer_id uuid not null
    references public.trainers(id)
    on delete cascade,

  day date not null,

  previous_status text,
  new_status text,

  changed_by_user_id uuid
    references auth.users(id)
    on delete set null,

  source text not null
    default 'unknown',

  organization_id uuid
    references public.organizations(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  constraint trainer_availability_history_source_check
    check (
      source in (
        'trainer',
        'organization',
        'unknown'
      )
    )
);


-- ------------------------------------------------------------
-- 2. Index
-- ------------------------------------------------------------

create index if not exists
  trainer_availability_history_trainer_day_idx
on public.trainer_availability_history (
  trainer_id,
  day,
  created_at desc
);


create index if not exists
  trainer_availability_history_user_idx
on public.trainer_availability_history (
  changed_by_user_id
);


-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------

alter table public.trainer_availability_history
enable row level security;


-- ------------------------------------------------------------
-- 4. Fonction trigger
-- ------------------------------------------------------------

create or replace function public.log_trainer_availability_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_source text := 'unknown';
  v_organization_id uuid := null;
begin

  v_user_id := auth.uid();


  -- ----------------------------------------------------------
  -- Détermination de l'origine de la modification
  -- ----------------------------------------------------------

  if v_user_id is not null then

    -- Le compte connecté correspond-il au formateur ?
    if exists (
      select 1
      from public.trainers t
      where t.id = new.trainer_id
        and t.user_id = v_user_id
    ) then

      v_source := 'trainer';


    else

      -- Sinon, cherche un organisme actif auquel
      -- appartient l'utilisateur.
      select om.organization_id
      into v_organization_id
      from public.organization_members om
      where om.user_id = v_user_id
        and om.status = 'active'
      order by om.joined_at asc
      limit 1;


      if v_organization_id is not null then
        v_source := 'organization';
      end if;

    end if;

  end if;


  -- ----------------------------------------------------------
  -- INSERT : première déclaration
  -- ----------------------------------------------------------

  if tg_op = 'INSERT' then

    insert into public.trainer_availability_history (
      trainer_id,
      day,
      previous_status,
      new_status,
      changed_by_user_id,
      source,
      organization_id
    )
    values (
      new.trainer_id,
      new.day,
      null,
      new.status,
      v_user_id,
      v_source,
      v_organization_id
    );

    return new;

  end if;


  -- ----------------------------------------------------------
  -- UPDATE : uniquement si le statut change réellement
  -- ----------------------------------------------------------

  if tg_op = 'UPDATE'
     and old.status is distinct from new.status then

    insert into public.trainer_availability_history (
      trainer_id,
      day,
      previous_status,
      new_status,
      changed_by_user_id,
      source,
      organization_id
    )
    values (
      new.trainer_id,
      new.day,
      old.status,
      new.status,
      v_user_id,
      v_source,
      v_organization_id
    );

  end if;


  return new;

end;
$$;


-- ------------------------------------------------------------
-- 5. Trigger
-- ------------------------------------------------------------

drop trigger if exists
  trainer_availability_history_trigger
on public.trainer_availability;


create trigger trainer_availability_history_trigger
after insert or update
on public.trainer_availability
for each row
execute function public.log_trainer_availability_change();


-- ------------------------------------------------------------
-- 6. Lecture de son propre historique par le formateur
-- ------------------------------------------------------------

drop policy if exists
  "Trainer can read own availability history"
on public.trainer_availability_history;


create policy
  "Trainer can read own availability history"
on public.trainer_availability_history
for select
to authenticated
using (
  exists (
    select 1
    from public.trainers t
    where t.id = trainer_availability_history.trainer_id
      and t.user_id = auth.uid()
  )
);


-- ------------------------------------------------------------
-- 7. Lecture par les membres d'un organisme
-- ------------------------------------------------------------

drop policy if exists
  "Organization members can read availability history"
on public.trainer_availability_history;


create policy
  "Organization members can read availability history"
on public.trainer_availability_history
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.user_id = auth.uid()
      and om.status = 'active'
  )
);