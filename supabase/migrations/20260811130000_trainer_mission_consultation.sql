-- ============================================================
-- TimeForma
-- Consultation sécurisée des missions par le formateur
-- ============================================================


-- ============================================================
-- 1. ENGAGEMENTS DU FORMATEUR AVEC MISSION_ID
-- ============================================================

create or replace function public.get_my_trainer_commitments_with_mission(
  p_start_day date,
  p_end_day date
)
returns table (
  day date,
  status text,
  mission_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    md.date as day,

    case
      when mf.statut = 'affecte'
        then 'mission'
      when mf.statut = 'accepte'
        then 'option'
      else null
    end as status,

    m.id as mission_id

  from public.trainers t

  join public.mission_formateurs mf
    on mf.formateur_id = t.id

  join public.missions m
    on m.id = mf.mission_id

  join public.mission_dates md
    on md.mission_id = m.id

  where t.user_id = auth.uid()

    and mf.statut in (
      'accepte',
      'affecte'
    )

    and md.date >= p_start_day
    and md.date <= p_end_day

  order by
    md.date,
    m.id;
$$;


revoke all
on function public.get_my_trainer_commitments_with_mission(
  date,
  date
)
from public;


grant execute
on function public.get_my_trainer_commitments_with_mission(
  date,
  date
)
to authenticated;



-- ============================================================
-- 2. CONSULTATION D'UNE MISSION PAR LE FORMATEUR
--
-- IMPORTANT :
-- Cette fonction n'expose PAS :
-- - le client
-- - le prix de vente
-- - le coût formateur interne
-- - les commentaires internes
-- - le code interne OF
-- - les autres formateurs
-- ============================================================

create or replace function public.get_my_trainer_mission(
  p_mission_id uuid
)
returns table (
  id uuid,
  relation_status text,
  title text,
  formation text,
  lieu text,
  adresse text,
  code_postal text,
  ville text,
  dates jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_trainer_id uuid;
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;


  if p_mission_id is null then
    raise exception 'MISSION_REQUIRED';
  end if;


  select t.id
  into v_trainer_id

  from public.trainers t

  where t.user_id = auth.uid()

  limit 1;


  if v_trainer_id is null then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;


  /*
   * Le formateur ne peut consulter que
   * les missions qu'il a acceptées ou
   * auxquelles il est officiellement affecté.
   */
  if not exists (
    select 1

    from public.mission_formateurs mf

    where mf.mission_id = p_mission_id

      and mf.formateur_id = v_trainer_id

      and mf.statut in (
        'accepte',
        'affecte'
      )
  ) then
    raise exception 'MISSION_ACCESS_DENIED';
  end if;


  return query

  select
    m.id,

    mf.statut,

    coalesce(
      nullif(
        btrim(m.intitule),
        ''
      ),
      nullif(
        btrim(m.formation),
        ''
      ),
      'Mission de formation'
    ) as title,

    m.formation,

    m.lieu,

    m.adresse,

    m.code_postal,

    m.ville,

    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date',
            md.date,

            'heure_debut',
            md.heure_debut,

            'heure_fin',
            md.heure_fin
          )
          order by md.date
        )

        from public.mission_dates md

        where md.mission_id =
          m.id
      ),
      '[]'::jsonb
    ) as dates

  from public.missions m

  join public.mission_formateurs mf
    on mf.mission_id = m.id

  where m.id =
    p_mission_id

    and mf.formateur_id =
      v_trainer_id

    and mf.statut in (
      'accepte',
      'affecte'
    )

  limit 1;

end;
$$;


revoke all
on function public.get_my_trainer_mission(uuid)
from public;


grant execute
on function public.get_my_trainer_mission(uuid)
to authenticated;
