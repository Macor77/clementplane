-- ==========================================================
-- MINI SPRINT 8.2
-- Propositions de mission accessibles sans compte
-- ==========================================================

create extension if not exists pgcrypto;

alter table public.mission_formateurs
    add column if not exists proposal_token uuid,
    add column if not exists proposal_expires_at timestamptz,
    add column if not exists proposal_viewed_at timestamptz,
    add column if not exists response_comment text;

create unique index if not exists mission_formateurs_proposal_token_key
    on public.mission_formateurs (proposal_token)
    where proposal_token is not null;

-- Génère ou réutilise le lien public d'une proposition.
-- L'accès anon est temporaire tant que l'interface OF n'est pas protégée
-- par l'authentification du Mini Sprint 8.4.
create or replace function public.create_mission_proposal(
    p_mission_formateur_id uuid,
    p_expires_at timestamptz default (now() + interval '14 days')
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_token uuid;
begin
    update public.mission_formateurs
    set
        proposal_token = coalesce(proposal_token, gen_random_uuid()),
        proposal_expires_at = coalesce(p_expires_at, now() + interval '14 days'),
        proposal_viewed_at = null,
        response_comment = null,
        statut = 'proposition_envoyee',
        propose_le = coalesce(propose_le, now()),
        repondu_le = null,
        affecte_le = null
    where id = p_mission_formateur_id
      and statut in (
          'selectionne',
          'proposition_envoyee',
          'refuse',
          'annule'
      )
    returning proposal_token into v_token;

    if v_token is null then
        raise exception 'Cette proposition ne peut pas être préparée dans son état actuel.';
    end if;

    return v_token;
end;
$$;

-- Retourne uniquement les informations utiles au formateur.
create or replace function public.get_public_mission_proposal(
    p_token uuid
)
returns table (
    mission_formateur_id uuid,
    trainer_first_name text,
    trainer_last_name text,
    mission_title text,
    formation text,
    client text,
    location text,
    postal_code text,
    city text,
    offered_fee numeric,
    mission_notes text,
    dates jsonb,
    status text,
    sent_at timestamptz,
    viewed_at timestamptz,
    responded_at timestamptz,
    expires_at timestamptz,
    response_comment text
)
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.mission_formateurs
    set proposal_viewed_at = coalesce(proposal_viewed_at, now())
    where proposal_token = p_token;

    return query
    select
        mf.id,
        t.prenom,
        t.nom,
        coalesce(m.intitule, m.formation, 'Mission de formation'),
        m.formation,
        m.client,
        m.lieu,
        m.code_postal,
        m.ville,
        m.cout_formateur,
        m.commentaire,
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'date', md.date,
                    'heure_debut', md.heure_debut,
                    'heure_fin', md.heure_fin
                )
                order by md.date, md.heure_debut
            ) filter (where md.id is not null),
            '[]'::jsonb
        ),
        mf.statut,
        mf.propose_le,
        mf.proposal_viewed_at,
        mf.repondu_le,
        mf.proposal_expires_at,
        mf.response_comment
    from public.mission_formateurs mf
    join public.missions m on m.id = mf.mission_id
    join public.trainers t on t.id = mf.formateur_id
    left join public.mission_dates md on md.mission_id = m.id
    where mf.proposal_token = p_token
    group by mf.id, t.id, m.id;
end;
$$;

create or replace function public.respond_to_mission_proposal(
    p_token uuid,
    p_response text,
    p_comment text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_status text;
    v_expires_at timestamptz;
begin
    if p_response not in ('accepte', 'refuse') then
        raise exception 'Réponse invalide.';
    end if;

    select statut, proposal_expires_at
    into v_status, v_expires_at
    from public.mission_formateurs
    where proposal_token = p_token
    for update;

    if not found then
        raise exception 'Proposition introuvable.';
    end if;

    if v_expires_at is not null and v_expires_at < now() then
        raise exception 'Cette proposition a expiré.';
    end if;

    if v_status <> 'proposition_envoyee' then
        raise exception 'Une réponse a déjà été enregistrée pour cette proposition.';
    end if;

    update public.mission_formateurs
    set
        statut = p_response,
        repondu_le = now(),
        response_comment = nullif(trim(p_comment), ''),
        commentaire = coalesce(nullif(trim(p_comment), ''), commentaire),
        affecte_le = null
    where proposal_token = p_token;

    return p_response;
end;
$$;

revoke all on function public.create_mission_proposal(uuid, timestamptz) from public;
revoke all on function public.get_public_mission_proposal(uuid) from public;
revoke all on function public.respond_to_mission_proposal(uuid, text, text) from public;

grant execute on function public.create_mission_proposal(uuid, timestamptz) to anon, authenticated;
grant execute on function public.get_public_mission_proposal(uuid) to anon, authenticated;
grant execute on function public.respond_to_mission_proposal(uuid, text, text) to anon, authenticated;
