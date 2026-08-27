-- ==========================================================
-- SPRINT 10 — Options / OF visible / désistement enrichi
-- ==========================================================

alter table public.mission_formateurs
  add column if not exists withdrawal_comment text;

-- ----------------------------------------------------------
-- Mes propositions / missions formateur : expose l'OF
-- et le commentaire de désistement.
-- ----------------------------------------------------------

drop function if exists public.get_my_mission_proposals();

create function public.get_my_mission_proposals()
returns table (
  mission_formateur_id uuid,
  mission_id uuid,
  status text,

  proposed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  response_comment text,
  withdrawal_comment text,

  mission_title text,
  formation text,
  client text,

  location text,
  postal_code text,
  city text,

  offered_fee numeric,
  mission_notes text,

  organization_id uuid,
  organization_name text,

  dates jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mf.id as mission_formateur_id,
    mf.mission_id,
    mf.statut as status,

    mf.propose_le as proposed_at,
    mf.repondu_le as responded_at,
    mf.proposal_expires_at as expires_at,
    mf.response_comment,
    mf.withdrawal_comment,

    coalesce(
      nullif(m.intitule, ''),
      nullif(m.formation, ''),
      nullif(m.client, ''),
      'Mission de formation'
    ) as mission_title,

    m.formation,
    m.client,

    m.lieu as location,
    m.code_postal as postal_code,
    m.ville as city,

    m.cout_formateur as offered_fee,
    m.commentaire as mission_notes,

    o.id as organization_id,
    o.name as organization_name,

    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', md.date,
            'heure_debut', md.heure_debut,
            'heure_fin', md.heure_fin
          )
          order by md.date
        )
        from public.mission_dates md
        where md.mission_id = m.id
      ),
      '[]'::jsonb
    ) as dates

  from public.mission_formateurs mf
  join public.trainers t
    on t.id = mf.formateur_id
  join public.missions m
    on m.id = mf.mission_id
  left join public.organizations o
    on o.id = m.organization_id

  where t.user_id = auth.uid()
    and mf.statut in (
      'proposition_envoyee',
      'accepte',
      'refuse',
      'affecte',
      'indisponible_affecte_ailleurs',
      'annule',
      'desiste',
      'mission_pourvue'
    )

  order by
    coalesce(mf.propose_le, mf.created_at) desc;
$$;

revoke all
on function public.get_my_mission_proposals()
from public;

grant execute
on function public.get_my_mission_proposals()
to authenticated;


-- ----------------------------------------------------------
-- Engagements calendrier : retourne TOUTES les options d'une
-- même journée avec le nom de l'OF, au lieu de forcer l'UI à
-- n'en retenir qu'une seule.
-- ----------------------------------------------------------

drop function if exists public.get_my_trainer_commitments_with_mission(date, date);

create function public.get_my_trainer_commitments_with_mission(
  p_start_day date,
  p_end_day date
)
returns table (
  day date,
  status text,
  mission_id uuid,
  mission_formateur_id uuid,
  mission_title text,
  organization_id uuid,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    md.date as day,
    case
      when mf.statut = 'affecte' then 'mission'
      when mf.statut = 'accepte' then 'option'
      else null
    end as status,
    m.id as mission_id,
    mf.id as mission_formateur_id,
    coalesce(
      nullif(m.intitule, ''),
      nullif(m.formation, ''),
      'Mission de formation'
    ) as mission_title,
    o.id as organization_id,
    o.name as organization_name

  from public.trainers t
  join public.mission_formateurs mf
    on mf.formateur_id = t.id
  join public.missions m
    on m.id = mf.mission_id
  join public.mission_dates md
    on md.mission_id = m.id
  left join public.organizations o
    on o.id = m.organization_id

  where t.user_id = auth.uid()
    and mf.statut in ('accepte', 'affecte')
    and md.date >= p_start_day
    and md.date <= p_end_day

  order by md.date, mf.statut desc, m.id;
$$;

revoke all
on function public.get_my_trainer_commitments_with_mission(date, date)
from public;

grant execute
on function public.get_my_trainer_commitments_with_mission(date, date)
to authenticated;


-- ----------------------------------------------------------
-- Désistement avec commentaire facultatif.
-- On garde aussi une version 2 arguments pour compatibilité.
-- ----------------------------------------------------------

drop function if exists public.withdraw_from_my_mission_option(uuid, jsonb);

drop function if exists public.withdraw_from_my_mission_option(uuid, jsonb, text);

create function public.withdraw_from_my_mission_option(
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

  if v_status <> 'accepte' then
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
    withdrawal_comment = nullif(btrim(coalesce(p_comment, '')), '')
  where id = p_mission_formateur_id;

  for v_day in
    select md.date
    from public.mission_dates md
    where md.mission_id = v_mission_id
    order by md.date
  loop
    v_day_status := coalesce(
      p_availability_by_day ->> v_day.date::text,
      ''
    );

    if v_day_status not in ('', 'dispo', 'indispo') then
      v_day_status := '';
    end if;

    insert into public.trainer_availability (
      trainer_id,
      day,
      status,
      updated_at
    )
    values (
      v_trainer_id,
      v_day.date,
      v_day_status,
      now()
    )
    on conflict (trainer_id, day)
    do update
    set
      status = excluded.status,
      updated_at = excluded.updated_at;
  end loop;

  return true;
end;
$$;

revoke all
on function public.withdraw_from_my_mission_option(uuid, jsonb, text)
from public;

grant execute
on function public.withdraw_from_my_mission_option(uuid, jsonb, text)
to authenticated;

create function public.withdraw_from_my_mission_option(
  p_mission_formateur_id uuid,
  p_availability_by_day jsonb
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.withdraw_from_my_mission_option(
    p_mission_formateur_id,
    p_availability_by_day,
    ''::text
  );
$$;

revoke all
on function public.withdraw_from_my_mission_option(uuid, jsonb)
from public;

grant execute
on function public.withdraw_from_my_mission_option(uuid, jsonb)
to authenticated;


-- ----------------------------------------------------------
-- Fiche contact OF accessible uniquement au formateur qui a
-- une relation avec cette mission. On expose un contact membre
-- owner/admin/manager en priorité.
-- ----------------------------------------------------------

drop function if exists public.get_my_mission_organization_contact(uuid);

create function public.get_my_mission_organization_contact(
  p_mission_id uuid
)
returns table (
  organization_id uuid,
  organization_name text,
  legal_name text,
  address text,
  postal_code text,
  city text,
  country text,
  logo_url text,
  contact_name text,
  contact_email text,
  contact_phone text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_trainer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select t.id
  into v_trainer_id
  from public.trainers t
  where t.user_id = auth.uid()
  limit 1;

  if v_trainer_id is null then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.mission_formateurs mf
    where mf.mission_id = p_mission_id
      and mf.formateur_id = v_trainer_id
  ) then
    raise exception 'MISSION_ACCESS_DENIED';
  end if;

  return query
  select
    o.id,
    o.name,
    o.legal_name,
    o.address,
    o.postal_code,
    o.city,
    o.country,
    o.logo_url,
    nullif(
      btrim(concat_ws(' ', p.first_name, p.last_name)),
      ''
    ) as contact_name,
    u.email::text as contact_email,
    p.phone as contact_phone
  from public.missions m
  join public.organizations o
    on o.id = m.organization_id
  left join lateral (
    select om.user_id
    from public.organization_members om
    where om.organization_id = o.id
      and om.status = 'active'
    order by
      case om.role
        when 'owner' then 1
        when 'admin' then 2
        when 'manager' then 3
        else 4
      end,
      om.joined_at nulls last,
      om.created_at
    limit 1
  ) member on true
  left join public.profiles p
    on p.id = member.user_id
  left join auth.users u
    on u.id = member.user_id
  where m.id = p_mission_id
  limit 1;
end;
$$;

revoke all
on function public.get_my_mission_organization_contact(uuid)
from public;

grant execute
on function public.get_my_mission_organization_contact(uuid)
to authenticated;
