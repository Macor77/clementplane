-- ============================================================
-- TimeForma
-- Correction de l'origine des modifications de disponibilité
--
-- Le contexte n'est plus deviné depuis le compte utilisateur.
-- L'application indique explicitement :
--   - trainer
--   - organization
-- ============================================================


-- ------------------------------------------------------------
-- 1. Le trigger lit maintenant le contexte explicite
-- ------------------------------------------------------------

create or replace function public.log_trainer_availability_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_source text;
  v_organization_id uuid;
  v_source_setting text;
  v_organization_setting text;
begin

  v_user_id := auth.uid();

  /*
   * Les RPC TimeForma positionnent ces valeurs
   * dans la transaction avant de modifier
   * trainer_availability.
   */
  v_source_setting :=
    current_setting(
      'timeforma.availability_source',
      true
    );

  v_organization_setting :=
    current_setting(
      'timeforma.organization_id',
      true
    );


  -- ----------------------------------------------------------
  -- Source
  -- ----------------------------------------------------------

  if v_source_setting in (
    'trainer',
    'organization'
  ) then
    v_source := v_source_setting;
  else
    v_source := 'unknown';
  end if;


  -- ----------------------------------------------------------
  -- Organisme
  -- ----------------------------------------------------------

  if
    v_source = 'organization'
    and nullif(
      v_organization_setting,
      ''
    ) is not null
  then
    begin
      v_organization_id :=
        v_organization_setting::uuid;
    exception
      when others then
        v_organization_id := null;
    end;
  else
    v_organization_id := null;
  end if;


  -- ----------------------------------------------------------
  -- Première déclaration
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
  -- Modification réelle du statut
  -- ----------------------------------------------------------

  if
    tg_op = 'UPDATE'
    and old.status is distinct from new.status
  then

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



-- ============================================================
-- 2. RPC FORMATEUR
--
-- On remplace la RPC existante afin qu'elle positionne
-- explicitement le contexte "trainer".
-- ============================================================

create or replace function public.set_my_trainer_availability(
  p_day date,
  p_status text,
  p_note text default ''
)
returns table (
  day date,
  status text,
  note text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_trainer_id uuid;
  clean_status text :=
    coalesce(
      p_status,
      ''
    );
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;


  if p_day is null then
    raise exception 'DAY_REQUIRED';
  end if;


  if clean_status not in (
    '',
    'dispo',
    'indispo'
  ) then
    raise exception 'INVALID_AVAILABILITY_STATUS';
  end if;


  select t.id
  into current_trainer_id

  from public.trainers t

  where t.user_id = auth.uid()

  limit 1;


  if current_trainer_id is null then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;


  /*
   * Contexte explicite pour le trigger.
   * true = valeur limitée à la transaction.
   */
  perform set_config(
    'timeforma.availability_source',
    'trainer',
    true
  );

  perform set_config(
    'timeforma.organization_id',
    '',
    true
  );


  insert into public.trainer_availability (
    trainer_id,
    day,
    status,
    updated_at
  )
  values (
    current_trainer_id,
    p_day,
    clean_status,
    now()
  )

  on conflict
  on constraint trainer_availability_trainer_day_unique

  do update set
    status =
      excluded.status,

    updated_at =
      now();


  return query

  select
    ta.day,
    coalesce(
      ta.status,
      ''
    ),
    coalesce(
      ta.note,
      ''
    ),
    ta.updated_at

  from public.trainer_availability ta

  where
    ta.trainer_id =
      current_trainer_id
    and ta.day =
      p_day

  limit 1;

end;
$$;


revoke all
on function public.set_my_trainer_availability(
  date,
  text,
  text
)
from public;


grant execute
on function public.set_my_trainer_availability(
  date,
  text,
  text
)
to authenticated;



-- ============================================================
-- 3. NOUVELLE RPC ORGANISME
--
-- Un OF ne modifie plus directement trainer_availability.
-- ============================================================

create or replace function public.set_organization_trainer_availability(
  p_organization_id uuid,
  p_trainer_id uuid,
  p_day date,
  p_status text
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_status text :=
    coalesce(
      p_status,
      ''
    );
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;


  if p_organization_id is null then
    raise exception 'ORGANIZATION_REQUIRED';
  end if;


  if p_trainer_id is null then
    raise exception 'TRAINER_REQUIRED';
  end if;


  if p_day is null then
    raise exception 'DAY_REQUIRED';
  end if;


  if clean_status not in (
    '',
    'dispo',
    'indispo'
  ) then
    raise exception 'INVALID_AVAILABILITY_STATUS';
  end if;


  /*
   * Vérifie que l'utilisateur connecté
   * appartient réellement à cet organisme.
   */
  if not exists (
    select 1

    from public.organization_members om

    where
      om.organization_id =
        p_organization_id

      and om.user_id =
        auth.uid()

      and om.status =
        'active'
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;


  /*
   * Contexte explicite pour le trigger.
   */
  perform set_config(
    'timeforma.availability_source',
    'organization',
    true
  );

  perform set_config(
    'timeforma.organization_id',
    p_organization_id::text,
    true
  );


  insert into public.trainer_availability (
    trainer_id,
    day,
    status,
    updated_at
  )
  values (
    p_trainer_id,
    p_day,
    clean_status,
    now()
  )

  on conflict
  on constraint trainer_availability_trainer_day_unique

  do update set
    status =
      excluded.status,

    updated_at =
      now();


  return query

  select
    ta.id,
    ta.trainer_id,
    ta.day,
    coalesce(
      ta.status,
      ''
    ),
    ta.updated_at

  from public.trainer_availability ta

  where
    ta.trainer_id =
      p_trainer_id

    and ta.day =
      p_day

  limit 1;

end;
$$;


revoke all
on function public.set_organization_trainer_availability(
  uuid,
  uuid,
  date,
  text
)
from public;


grant execute
on function public.set_organization_trainer_availability(
  uuid,
  uuid,
  date,
  text
)
to authenticated;