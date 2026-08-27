-- ============================================================
-- FORMAPLANE — SPRINT 19
-- Mes OF + invitations organisme
-- ============================================================

-- 1) Statut enrichi du carnet « Mes OF ».
create or replace function public.get_my_trainer_organization_contact_status()
returns table (
  contact_id uuid,
  resolved_organization_id uuid,
  is_on_formaplane boolean,
  is_referenced boolean,
  last_invitation_at timestamptz,
  can_invite boolean,
  next_invitation_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with mine as (
    select public.current_trainer_profile_id() as trainer_id
  )
  select
    c.id as contact_id,
    coalesce(c.organization_id, matched.organization_id) as resolved_organization_id,
    (coalesce(c.organization_id, matched.organization_id) is not null) as is_on_formaplane,
    case
      when coalesce(c.organization_id, matched.organization_id) is null then false
      else exists (
        select 1
        from public.organization_trainers ot
        where ot.organization_id = coalesce(c.organization_id, matched.organization_id)
          and ot.trainer_id = c.trainer_id
      )
    end as is_referenced,
    invitation.reference_at as last_invitation_at,
    (
      coalesce(c.organization_id, matched.organization_id) is null
      and (
        invitation.reference_at is null
        or invitation.reference_at + interval '7 days' <= now()
      )
    ) as can_invite,
    case
      when invitation.reference_at is null then null
      else invitation.reference_at + interval '7 days'
    end as next_invitation_at
  from public.trainer_availability_contacts c
  cross join mine m
  left join lateral (
    select case when count(distinct om.organization_id) = 1
      then min(om.organization_id::text)::uuid
      else null
    end as organization_id
    from auth.users u
    join public.organization_members om
      on om.user_id = u.id
     and om.status = 'active'
    join public.organizations o
      on o.id = om.organization_id
     and o.status = 'active'
    where lower(btrim(coalesce(u.email, ''))) = lower(btrim(c.email))
  ) matched on true
  left join lateral (
    select coalesce(e.sent_at, e.created_at) as reference_at
    from public.email_logs e
    where e.email_type = 'trainer_organization_invitation'
      and e.metadata ->> 'trainer_id' = c.trainer_id::text
      and lower(btrim(e.recipient_email)) = lower(btrim(c.email))
      and (
        e.status in ('sent','delivered','soft_bounce','hard_bounce','blocked','invalid','deferred')
        or (e.status = 'pending' and e.created_at >= now() - interval '15 minutes')
      )
    order by coalesce(e.sent_at, e.created_at) desc
    limit 1
  ) invitation on true
  where c.trainer_id = m.trainer_id;
$$;

revoke all on function public.get_my_trainer_organization_contact_status() from public;
revoke all on function public.get_my_trainer_organization_contact_status() from anon;
grant execute on function public.get_my_trainer_organization_contact_status() to authenticated;


-- 2) Réservation atomique d'une invitation (7 jours complets).
create or replace function public.reserve_my_trainer_organization_invitation(
  p_contact_id uuid
)
returns table (
  success boolean,
  email_log_id uuid,
  invitation_token uuid,
  recipient_email text,
  next_invitation_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_trainer_id uuid;
  v_contact public.trainer_availability_contacts%rowtype;
  v_reference_at timestamptz;
  v_log_id uuid;
  v_token uuid := gen_random_uuid();
  v_registered boolean := false;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_trainer_id := public.current_trainer_profile_id();
  if v_trainer_id is null then
    raise exception 'TRAINER_PROFILE_REQUIRED';
  end if;

  select * into v_contact
  from public.trainer_availability_contacts c
  where c.id = p_contact_id
    and c.trainer_id = v_trainer_id
  for update;

  if v_contact.id is null then
    raise exception 'CONTACT_NOT_FOUND';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_trainer_id::text || ':' || lower(btrim(v_contact.email))));

  select exists (
    select 1
    from auth.users u
    join public.organization_members om
      on om.user_id = u.id
     and om.status = 'active'
    join public.organizations o
      on o.id = om.organization_id
     and o.status = 'active'
    where lower(btrim(coalesce(u.email, ''))) = lower(btrim(v_contact.email))
  ) into v_registered;

  if v_registered or v_contact.organization_id is not null then
    return query select false, null::uuid, null::uuid, v_contact.email,
      null::timestamptz, 'ORGANIZATION_ALREADY_ON_FORMAPLANE';
    return;
  end if;

  select coalesce(e.sent_at, e.created_at)
  into v_reference_at
  from public.email_logs e
  where e.email_type = 'trainer_organization_invitation'
    and e.metadata ->> 'trainer_id' = v_trainer_id::text
    and lower(btrim(e.recipient_email)) = lower(btrim(v_contact.email))
    and (
      e.status in ('sent','delivered','soft_bounce','hard_bounce','blocked','invalid','deferred')
      or (e.status = 'pending' and e.created_at >= now() - interval '15 minutes')
    )
  order by coalesce(e.sent_at, e.created_at) desc
  limit 1;

  if v_reference_at is not null
     and v_reference_at + interval '7 days' > now() then
    return query select false, null::uuid, null::uuid, v_contact.email,
      v_reference_at + interval '7 days', 'INVITATION_COOLDOWN';
    return;
  end if;

  insert into public.email_logs (
    email_type,
    provider,
    recipient_email,
    requested_by_user_id,
    related_entity_type,
    related_entity_id,
    status,
    metadata
  ) values (
    'trainer_organization_invitation',
    'brevo',
    lower(btrim(v_contact.email)),
    v_user_id,
    'trainer_availability_contact',
    v_contact.id,
    'pending',
    jsonb_build_object(
      'source', 'trainer_organization_invitation',
      'trainer_id', v_trainer_id,
      'contact_id', v_contact.id,
      'organization_name', v_contact.organization_name,
      'invitation_token', v_token
    )
  ) returning id into v_log_id;

  return query select true, v_log_id, v_token, lower(btrim(v_contact.email)),
    null::timestamptz, 'RESERVED';
end;
$$;

revoke all on function public.reserve_my_trainer_organization_invitation(uuid) from public;
revoke all on function public.reserve_my_trainer_organization_invitation(uuid) from anon;
grant execute on function public.reserve_my_trainer_organization_invitation(uuid) to authenticated;


-- 3) Résolution publique minimale du token reçu par e-mail.
create or replace function public.get_public_trainer_organization_invitation(
  p_token uuid
)
returns table (
  trainer_id uuid,
  trainer_first_name text,
  trainer_last_name text,
  organization_name text,
  recipient_email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.prenom,
    t.nom,
    coalesce(e.metadata ->> 'organization_name', ''),
    e.recipient_email
  from public.email_logs e
  join public.trainers t
    on t.id = nullif(e.metadata ->> 'trainer_id', '')::uuid
  where e.email_type = 'trainer_organization_invitation'
    and e.metadata ->> 'invitation_token' = p_token::text
    and e.status in ('sent','delivered','soft_bounce','hard_bounce','blocked','invalid','deferred')
  order by e.created_at desc
  limit 1;
$$;

revoke all on function public.get_public_trainer_organization_invitation(uuid) from public;
grant execute on function public.get_public_trainer_organization_invitation(uuid) to anon, authenticated;


-- 4) Consultation d'une fiche revendiquée par n'importe quel OF authentifié.
-- La fonction ne renvoie aucune donnée interne `organization_trainers`.
create or replace function public.get_trainer_profile_for_organization(
  p_trainer_id uuid
)
returns table (
  id uuid,
  prenom text,
  nom text,
  ville text,
  code_postal text,
  competences text[],
  materiel text[],
  user_id uuid,
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
    select 1 from public.organization_members om
    where om.user_id = auth.uid()
      and om.status = 'active'
  ) then
    raise exception 'ORGANIZATION_SPACE_REQUIRED';
  end if;

  return query
  select
    t.id, t.prenom, t.nom, t.ville, t.code_postal,
    coalesce(t.competences, '{}'::text[]),
    coalesce(t.materiel, '{}'::text[]),
    t.user_id, t.created_at
  from public.trainers t
  where t.id = p_trainer_id
    and t.user_id is not null
  limit 1;
end;
$$;

revoke all on function public.get_trainer_profile_for_organization(uuid) from public;
revoke all on function public.get_trainer_profile_for_organization(uuid) from anon;
grant execute on function public.get_trainer_profile_for_organization(uuid) to authenticated;
