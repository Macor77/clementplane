-- ==========================================================
-- FORMAPLANE — SPRINT 11.5.2
-- Suivi proposition : consultation + délivrabilité e-mail
-- ==========================================================

-- 1) Enrichissement du journal e-mail pour les événements Brevo.
alter table public.email_logs
  drop constraint if exists email_logs_status_check;

alter table public.email_logs
  add constraint email_logs_status_check
  check (status in (
    'pending', 'sent', 'delivered', 'failed',
    'soft_bounce', 'hard_bounce', 'blocked', 'invalid', 'deferred'
  ));

alter table public.email_logs
  add column if not exists delivered_at timestamptz,
  add column if not exists last_provider_event text,
  add column if not exists last_provider_event_at timestamptz;

create index if not exists email_logs_provider_message_id_idx
  on public.email_logs(provider_message_id)
  where provider_message_id is not null;

-- 2) La première ouverture de la page publique devient un vrai événement métier.
drop function if exists public.get_public_mission_proposal(uuid);

create function public.get_public_mission_proposal(p_token uuid)
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
    response_comment text,
    organization_id uuid,
    organization_name text,
    organization_legal_name text,
    organization_contact_name text,
    organization_contact_email text,
    organization_contact_phone text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_mf public.mission_formateurs%rowtype;
  v_org_name text;
begin
  select * into v_mf
  from public.mission_formateurs
  where proposal_token = p_token;

  if v_mf.id is not null and v_mf.proposal_viewed_at is null then
    update public.mission_formateurs
    set proposal_viewed_at = now()
    where id = v_mf.id
      and proposal_viewed_at is null;

    if found then
      select coalesce(o.name, o.legal_name)
      into v_org_name
      from public.missions m
      join public.organizations o on o.id = m.organization_id
      where m.id = v_mf.mission_id;

      insert into public.mission_trainer_history (
        mission_id, trainer_id, mission_formateur_id,
        action, previous_status, new_status,
        actor_type, actor_display_name,
        actor_organization_name, details
      ) values (
        v_mf.mission_id, v_mf.formateur_id, v_mf.id,
        'proposal_viewed', v_mf.statut, v_mf.statut,
        'trainer', 'Formateur', v_org_name,
        jsonb_build_object('source', 'public_proposal_link')
      );
    end if;
  end if;

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
              ) order by md.date, md.heure_debut
          ) filter (where md.id is not null),
          '[]'::jsonb
      ),
      mf.statut,
      mf.propose_le,
      mf.proposal_viewed_at,
      mf.repondu_le,
      mf.proposal_expires_at,
      mf.response_comment,
      o.id,
      coalesce(o.name, o.legal_name),
      o.legal_name,
      nullif(btrim(concat_ws(' ', contact_profile.first_name, contact_profile.last_name)), ''),
      contact_user.email::text,
      contact_profile.phone
  from public.mission_formateurs mf
  join public.missions m on m.id = mf.mission_id
  join public.trainers t on t.id = mf.formateur_id
  join public.organizations o on o.id = m.organization_id
  left join public.mission_dates md on md.mission_id = m.id
  left join lateral (
    select om.user_id
    from public.organization_members om
    where om.organization_id = o.id and om.status = 'active'
    order by case om.role when 'owner' then 1 when 'admin' then 2 when 'manager' then 3 else 4 end,
             om.joined_at nulls last, om.created_at
    limit 1
  ) contact_member on true
  left join public.profiles contact_profile on contact_profile.id = contact_member.user_id
  left join auth.users contact_user on contact_user.id = contact_member.user_id
  where mf.proposal_token = p_token
  group by mf.id, t.id, m.id, o.id, contact_profile.id, contact_user.id;
end;
$$;

revoke all on function public.get_public_mission_proposal(uuid) from public;
grant execute on function public.get_public_mission_proposal(uuid) to anon, authenticated;
