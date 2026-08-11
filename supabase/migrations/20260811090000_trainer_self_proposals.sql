-- ==========================================================
-- MINI SPRINT 8.3
-- Mes propositions - espace Formateur
-- ==========================================================


-- ----------------------------------------------------------
-- 1. Liste des propositions du formateur connecté
-- ----------------------------------------------------------

create or replace function public.get_my_mission_proposals()
returns table (
  mission_formateur_id uuid,
  mission_id uuid,
  status text,

  proposed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  response_comment text,

  mission_title text,
  formation text,
  client text,

  location text,
  postal_code text,
  city text,

  offered_fee numeric,
  mission_notes text,

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

  where t.user_id = auth.uid()

    and mf.statut in (
      'proposition_envoyee',
      'accepte',
      'refuse',
      'affecte',
      'indisponible_affecte_ailleurs',
      'annule'
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
-- 2. Répondre depuis l'espace Formateur
--
-- IMPORTANT :
-- on ne recrée pas le moteur.
--
-- On récupère le token de LA proposition appartenant
-- au formateur connecté puis on appelle le même moteur
-- que celui utilisé par le lien public.
-- ----------------------------------------------------------

create or replace function public.respond_to_my_mission_proposal(
  p_mission_formateur_id uuid,
  p_response text,
  p_comment text default ''
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_token uuid;
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_response not in ('accepte', 'refuse') then
    raise exception 'INVALID_RESPONSE';
  end if;

  select mf.proposal_token
  into current_token

  from public.mission_formateurs mf

  join public.trainers t
    on t.id = mf.formateur_id

  where mf.id = p_mission_formateur_id
    and t.user_id = auth.uid()

  limit 1;


  if current_token is null then
    raise exception 'PROPOSAL_NOT_FOUND';
  end if;


  perform public.respond_to_mission_proposal(
    current_token,
    p_response,
    coalesce(p_comment, '')
  );


  return true;

end;
$$;


revoke all
on function public.respond_to_my_mission_proposal(uuid, text, text)
from public;

grant execute
on function public.respond_to_my_mission_proposal(uuid, text, text)
to authenticated;