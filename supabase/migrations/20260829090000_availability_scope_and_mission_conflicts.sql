-- Clementplane — Sprint 20.5
-- Disponibilités globales formateur / locales OF + missions sans blocage de conflit.

-- ============================================================
-- 1. Disponibilités propres à un organisme
-- ============================================================

create table if not exists public.organization_trainer_availability (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  trainer_id uuid not null
    references public.trainers(id)
    on delete cascade,

  day date not null,
  status text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_trainer_availability_status_check
    check (status in ('', 'dispo', 'indispo')),

  constraint organization_trainer_availability_unique
    unique (organization_id, trainer_id, day)
);

create index if not exists organization_trainer_availability_trainer_day_idx
  on public.organization_trainer_availability (trainer_id, day);

create index if not exists organization_trainer_availability_organization_day_idx
  on public.organization_trainer_availability (organization_id, day);

alter table public.organization_trainer_availability
  enable row level security;

revoke all on table public.organization_trainer_availability from anon, authenticated;

-- ============================================================
-- 2. Migration non destructive des données historiques actuellement mélangées
--
-- Le modèle historique mélangeait les écritures formateur et OF dans
-- trainer_availability. On reconstruit maintenant séparément :
--   * la dernière valeur de chaque OF et chaque couple formateur/date ;
--   * la dernière valeur globale du formateur ;
-- sans jamais déduire une valeur globale à partir du dernier événement OF.
--
-- IMPORTANT : cette section ne crée pas encore le trigger d'historique de la
-- nouvelle table, afin que la migration des anciennes données ne génère pas
-- de faux événements datés du moment du déploiement.
-- ============================================================

-- 2.a. Chaque OF conserve sa dernière valeur historique connue.
insert into public.organization_trainer_availability (
  organization_id,
  trainer_id,
  day,
  status,
  created_at,
  updated_at
)
select
  x.organization_id,
  x.trainer_id,
  x.day,
  coalesce(x.new_status, ''),
  x.created_at,
  x.created_at
from (
  select distinct on (h.organization_id, h.trainer_id, h.day)
    h.organization_id,
    h.trainer_id,
    h.day,
    h.new_status,
    h.created_at
  from public.trainer_availability_history h
  where h.source = 'organization'
    and h.organization_id is not null
  order by
    h.organization_id,
    h.trainer_id,
    h.day,
    h.created_at desc,
    h.id desc
) x
on conflict (organization_id, trainer_id, day)
do update set
  status = excluded.status,
  updated_at = excluded.updated_at;

-- 2.b. Suspend temporairement le trigger historique de l'ancienne table :
-- les opérations de reconstruction ci-dessous ne sont pas des actions
-- utilisateur et ne doivent pas créer de faux événements.
alter table public.trainer_availability
  disable trigger trainer_availability_history_trigger;

-- 2.c. Reconstruction déterministe de la valeur globale.
--
-- La table historique est la seule source permettant de distinguer les
-- anciennes écritures formateur des anciennes écritures OF. Pour chaque
-- couple formateur/date, on regarde le dernier événement de chaque source.
--
-- Règle :
--   * dernier événement = formateur : la ligne actuelle est déjà globale ;
--   * dernier événement = OF + une valeur formateur existe : on restaure la
--     dernière valeur formateur dans la ligne globale ;
--   * dernier événement = OF + aucune valeur formateur n'existe : la ligne
--     globale est ramenée à "" et la valeur OF est conservée dans la nouvelle
--     table créée en 2.a ;
--   * aucun historique : la ligne actuelle n'est jamais modifiée.
--
-- Aucune ligne de trainer_availability n'est supprimée.
update public.trainer_availability ta
set
  status = coalesce(t.new_status, ''),
  updated_at = coalesce(t.created_at, ta.updated_at)
from (
  select
    la.trainer_id,
    la.day,
    la.source as latest_source,
    lt.new_status,
    lt.created_at
  from (
    select distinct on (h.trainer_id, h.day)
      h.trainer_id,
      h.day,
      h.source
    from public.trainer_availability_history h
    order by h.trainer_id, h.day, h.created_at desc, h.id desc
  ) la
  left join lateral (
    select
      h.new_status,
      h.created_at
    from public.trainer_availability_history h
    where h.trainer_id = la.trainer_id
      and h.day = la.day
      and h.source = 'trainer'
    order by h.created_at desc, h.id desc
    limit 1
  ) lt on true
  where la.source = 'organization'
) t
where ta.trainer_id = t.trainer_id
  and ta.day = t.day;

-- Réactive le trigger après la reconstruction.
alter table public.trainer_availability
  enable trigger trainer_availability_history_trigger;

-- Toutes les autres lignes actuelles (notamment les disponibilités initiales
-- qui n'ont pas d'historique source OF) sont conservées telles quelles.

-- ============================================================
-- 3. Historique des disponibilités locales OF
-- ============================================================

create or replace function public.log_organization_trainer_availability_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous_status text;
  v_new_status text;
begin
  if tg_op = 'INSERT' then
    v_previous_status := null;
    v_new_status := new.status;
  else
    if old.status is not distinct from new.status then
      return new;
    end if;
    v_previous_status := old.status;
    v_new_status := new.status;
  end if;

  insert into public.trainer_availability_history (
    trainer_id,
    day,
    previous_status,
    new_status,
    changed_by_user_id,
    source,
    organization_id
  ) values (
    new.trainer_id,
    new.day,
    v_previous_status,
    v_new_status,
    v_user_id,
    'organization',
    new.organization_id
  );

  return new;
end;
$$;

drop trigger if exists organization_trainer_availability_history_trigger
on public.organization_trainer_availability;

create trigger organization_trainer_availability_history_trigger
after insert or update
on public.organization_trainer_availability
for each row
execute function public.log_organization_trainer_availability_change();

-- ============================================================
-- 4. RPC de lecture effective pour un OF
-- Priorité : disponibilité globale du formateur si renseignée,
-- sinon valeur locale de l'OF.
-- ============================================================

create or replace function public.get_organization_trainer_availability(
  p_organization_id uuid,
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  status text,
  updated_at timestamptz,
  source text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_organization_id is null
     or not public.is_organization_member(p_organization_id) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  return query
  with effective_days as (
    select ta.trainer_id, ta.day
    from public.trainer_availability ta
    where ta.trainer_id = any(p_trainer_ids)
      and ta.day >= p_start_day
      and ta.day <= p_end_day

    union

    select ota.trainer_id, ota.day
    from public.organization_trainer_availability ota
    where ota.organization_id = p_organization_id
      and ota.trainer_id = any(p_trainer_ids)
      and ota.day >= p_start_day
      and ota.day <= p_end_day
  )
  select
    coalesce(ta.id, ota.id) as id,
    ed.trainer_id,
    ed.day,
    case
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then ta.status
      else coalesce(ota.status, '')
    end as status,
    case
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then ta.updated_at
      else coalesce(ota.updated_at, ta.updated_at)
    end as updated_at,
    case
      when ta.id is not null
       and coalesce(ta.status, '') <> ''
        then 'trainer'
      when ota.id is not null
        then 'organization'
      else 'none'
    end as source
  from effective_days ed
  left join public.trainer_availability ta
    on ta.trainer_id = ed.trainer_id
   and ta.day = ed.day
  left join public.organization_trainer_availability ota
    on ota.organization_id = p_organization_id
   and ota.trainer_id = ed.trainer_id
   and ota.day = ed.day
  order by ed.day, ed.trainer_id;
end;
$$;

revoke all on function public.get_organization_trainer_availability(
  uuid, uuid[], date, date
) from public;

grant execute on function public.get_organization_trainer_availability(
  uuid, uuid[], date, date
) to authenticated;

-- ============================================================
-- 5. RPC d'écriture locale OF
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
  clean_status text := coalesce(p_status, '');
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

  if clean_status not in ('', 'dispo', 'indispo') then
    raise exception 'INVALID_AVAILABILITY_STATUS';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  if not exists (
    select 1
    from public.organization_trainers ot
    where ot.organization_id = p_organization_id
      and ot.trainer_id = p_trainer_id
  ) then
    raise exception 'TRAINER_NOT_IN_ORGANIZATION';
  end if;

  perform set_config('timeforma.availability_source', 'organization', true);
  perform set_config('timeforma.organization_id', p_organization_id::text, true);

  insert into public.organization_trainer_availability (
    organization_id,
    trainer_id,
    day,
    status,
    updated_at
  ) values (
    p_organization_id,
    p_trainer_id,
    p_day,
    clean_status,
    now()
  )
  on conflict (organization_id, trainer_id, day)
  do update set
    status = excluded.status,
    updated_at = now();

  return query
  select
    ota.id,
    ota.trainer_id,
    ota.day,
    ota.status,
    ota.updated_at
  from public.organization_trainer_availability ota
  where ota.organization_id = p_organization_id
    and ota.trainer_id = p_trainer_id
    and ota.day = p_day;
end;
$$;

revoke all on function public.set_organization_trainer_availability(
  uuid, uuid, date, text
) from public;

grant execute on function public.set_organization_trainer_availability(
  uuid, uuid, date, text
) to authenticated;

-- ============================================================
-- 6. Lecture globale directe interdite : tout passe par RPC.
-- ============================================================

revoke select on table public.trainer_availability from anon, authenticated;

-- ============================================================
-- 7. Le conflit d'affectation devient informatif, jamais bloquant.
-- Les appels historiques restent valides mais ne mutent plus les statuts.
-- ============================================================

create or replace function public.reconcile_trainer_conflicts_safe(
  p_trainer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- No automatic proposal status mutation anymore.
  return;
end;
$$;

revoke all on function public.reconcile_trainer_conflicts_safe(uuid) from public;
grant execute on function public.reconcile_trainer_conflicts_safe(uuid) to authenticated;



-- ============================================================
-- 8. Annulation / désistement : ne jamais écraser la disponibilité
-- ============================================================

create or replace function public.cancel_mission_with_trainers(
  p_mission_id uuid,
  p_channel text,
  p_note text default null
)
returns table (
  cancelled_trainers integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_count integer := 0;
  v_target record;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_channel not in (
    'email',
    'sms',
    'whatsapp',
    'phone',
    'other'
  ) then
    raise exception 'INVALID_CHANNEL';
  end if;

  if
    p_channel = 'other'
    and nullif(
      btrim(coalesce(p_note, '')),
      ''
    ) is null
  then
    raise exception 'CONTACT_NOTE_REQUIRED';
  end if;

  select m.organization_id
  into v_organization_id
  from public.missions m
  where m.id = p_mission_id
  for update;

  if v_organization_id is null then
    raise exception 'MISSION_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id =
      v_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if exists (
    select 1
    from public.missions m
    where m.id = p_mission_id
      and m.statut = 'annulee'
  ) then
    raise exception 'MISSION_ALREADY_CANCELLED';
  end if;

  -- On mémorise les formateurs concernés avant de clôturer leurs relations.
  create temporary table if not exists
    tmp_formaplane_cancelled_trainers (
      trainer_id uuid primary key
    )
  on commit drop;

  truncate table tmp_formaplane_cancelled_trainers;

  insert into tmp_formaplane_cancelled_trainers (
    trainer_id
  )
  select distinct mf.formateur_id
  from public.mission_formateurs mf
  where mf.mission_id = p_mission_id
    and mf.statut in (
      'proposition_envoyee',
      'accepte',
      'affecte',
      'indisponible_affecte_ailleurs'
    );

  perform set_config(
    'formaplane.actor_type',
    'organization',
    true
  );

  update public.mission_formateurs
  set
    statut = 'annule',
    affecte_le = null
  where mission_id = p_mission_id
    and statut in (
      'proposition_envoyee',
      'accepte',
      'affecte',
      'indisponible_affecte_ailleurs'
    );

  get diagnostics v_count = row_count;

  update public.missions
  set statut = 'annulee'
  where id = p_mission_id;

  update public.mission_change_requests
  set
    status = 'cancelled',
    resolved_at = now()
  where mission_id = p_mission_id
    and status = 'pending';

  update public.mission_change_request_trainers rt
  set
    response_status = 'cancelled',
    responded_at = now()
  from public.mission_change_requests r
  where rt.change_request_id = r.id
    and r.mission_id = p_mission_id
    and rt.response_status = 'pending';

  -- Availability is derived from the remaining missions and the underlying
  -- trainer/organization availability values; cancellation does not overwrite it.

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
    details
  )
  select
    p_mission_id,
    mf.formateur_id,
    mf.id,
    'cancellation_contact',
    mf.statut,
    mf.statut,
    auth.uid(),
    'organization',
    coalesce(
      nullif(
        btrim(
          concat_ws(
            ' ',
            p.first_name,
            p.last_name
          )
        ),
        ''
      ),
      'Utilisateur'
    ),
    v_organization_id,
    jsonb_build_object(
      'channel',
      p_channel,
      'note',
      nullif(
        btrim(coalesce(p_note, '')),
        ''
      )
    )
  from public.mission_formateurs mf
  left join public.profiles p
    on p.id = auth.uid()
  where mf.mission_id = p_mission_id
    and mf.statut = 'annule';

  return query
  select v_count;
end;
$$;


create or replace function public.withdraw_from_my_mission_option(
  p_mission_formateur_id uuid,
  p_availability_by_day jsonb,
  p_comment text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer_id uuid;
  v_mission_id uuid;
  v_status text;
  v_day record;
  v_day_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    mf.formateur_id,
    mf.mission_id,
    mf.statut
  into
    v_trainer_id,
    v_mission_id,
    v_status
  from public.mission_formateurs mf
  join public.trainers t
    on t.id = mf.formateur_id
  where mf.id = p_mission_formateur_id
    and t.user_id = auth.uid()
  for update of mf;

  if not found then
    raise exception 'OPTION_NOT_FOUND';
  end if;

  if v_status not in ('accepte', 'affecte') then
    raise exception 'WITHDRAWAL_NOT_ALLOWED';
  end if;

  perform set_config(
    'formaplane.actor_type',
    'trainer',
    true
  );

  update public.mission_formateurs
  set
    statut = 'desiste',
    affecte_le = null,
    withdrawal_comment =
      nullif(
        btrim(coalesce(p_comment, '')),
        ''
      )
  where id = p_mission_formateur_id;

  /*
   * Si le formateur était celui officiellement affecté,
   * la mission redevient à pourvoir.
   *
   * On respecte la logique existante : seuls les statuts
   * "affectee" sont automatiquement ramenés à "a_pourvoir".
   * Les statuts protégés comme "confirmee" ou "realisee"
   * ne sont pas réécrits ici.
   */
  if v_status = 'affecte' then
    update public.missions
    set statut = 'a_pourvoir'
    where id = v_mission_id
      and statut = 'affectee';
  end if;

  -- The mission withdrawal no longer overwrites availability.
  -- The supplied availability payload is kept for API compatibility only.

  return true;
end;
$$;


-- ============================================================
-- 9. Historique OF : aucune fuite entre organismes
-- ============================================================

create or replace function public.get_organization_availability_history(
  p_organization_id uuid,
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  previous_status text,
  new_status text,
  source text,
  changed_by_user_id uuid,
  actor_name text,
  organization_id uuid,
  organization_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  return query
  select
    h.id,
    h.trainer_id,
    h.day,
    h.previous_status,
    h.new_status,
    h.source,
    h.changed_by_user_id,
    nullif(concat_ws(' ', p.first_name, p.last_name), '') as actor_name,
    case when h.source = 'organization' then h.organization_id else null end,
    case when h.source = 'organization' then o.name else null end,
    h.created_at
  from public.trainer_availability_history h
  left join public.profiles p on p.id = h.changed_by_user_id
  left join public.organizations o on o.id = h.organization_id
  where h.trainer_id = any(p_trainer_ids)
    and h.day >= p_start_day
    and h.day <= p_end_day
    and (
      h.source = 'trainer'
      or (
        h.source = 'organization'
        and h.organization_id = p_organization_id
      )
    )
    and exists (
      select 1
      from public.organization_trainers ot
      where ot.organization_id = p_organization_id
        and ot.trainer_id = h.trainer_id
    )
  order by h.day, h.created_at desc;
end;
$$;

revoke all on function public.get_organization_availability_history(
  uuid, uuid[], date, date
) from public;

grant execute on function public.get_organization_availability_history(
  uuid, uuid[], date, date
) to authenticated;

revoke select on table public.trainer_availability_history from anon, authenticated;
