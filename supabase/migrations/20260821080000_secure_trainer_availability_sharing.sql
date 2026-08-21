-- ============================================================
-- FORMAPLANE
-- Sprint 13 — Sécurisation du partage des disponibilités
--
-- - cooldown de 20 jours par formateur + e-mail destinataire
-- - identité durable indépendante de l'id du contact
-- - réservation atomique avant envoi (anti double-clic / concurrence)
-- - exposition du prochain envoi autorisé dans le carnet
-- ============================================================

drop function if exists public.get_my_availability_contact_last_share_status();

create function public.get_my_availability_contact_last_share_status()
returns table (
  contact_id uuid,
  email_log_id uuid,
  delivery_status text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  shared_months text[],
  can_share boolean,
  next_share_at timestamptz,
  cooldown_reference_at timestamptz,
  copy_to_sender boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with my_trainer as (
    select public.current_trainer_profile_id() as trainer_id
  )
  select
    c.id as contact_id,
    latest.id as email_log_id,
    latest.status as delivery_status,
    coalesce(latest.sent_at, latest.created_at) as sent_at,
    latest.delivered_at,
    latest.failed_at,
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(latest.metadata -> 'months', '[]'::jsonb)
        )
      ),
      array[]::text[]
    ) as shared_months,
    (
      blocker.reference_at is null
      or blocker.reference_at + interval '20 days' <= now()
    ) as can_share,
    case
      when blocker.reference_at is null then null
      else blocker.reference_at + interval '20 days'
    end as next_share_at,
    blocker.reference_at as cooldown_reference_at,
    coalesce((latest.metadata ->> 'copy_to_sender')::boolean, false) as copy_to_sender
  from public.trainer_availability_contacts c
  cross join my_trainer mt
  left join lateral (
    select e.*
    from public.email_logs e
    where e.email_type = 'trainer_availability_share'
      and e.metadata ->> 'trainer_id' = mt.trainer_id::text
      and lower(btrim(e.recipient_email)) = lower(btrim(c.email))
    order by e.created_at desc
    limit 1
  ) latest on true
  left join lateral (
    select
      coalesce(e.sent_at, e.created_at) as reference_at
    from public.email_logs e
    where e.email_type = 'trainer_availability_share'
      and e.metadata ->> 'trainer_id' = mt.trainer_id::text
      and lower(btrim(e.recipient_email)) = lower(btrim(c.email))
      and (
        e.status in ('sent', 'delivered', 'soft_bounce', 'hard_bounce', 'blocked', 'invalid', 'deferred')
        or (e.status = 'pending' and e.created_at >= now() - interval '15 minutes')
      )
    order by coalesce(e.sent_at, e.created_at) desc
    limit 1
  ) blocker on true
  where c.trainer_id = mt.trainer_id;
$$;

revoke all
on function public.get_my_availability_contact_last_share_status()
from public;

revoke all
on function public.get_my_availability_contact_last_share_status()
from anon;

grant execute
on function public.get_my_availability_contact_last_share_status()
to authenticated;


create or replace function public.reserve_my_availability_share(
  p_contact_id uuid,
  p_months text[],
  p_trainer_message text default '',
  p_copy_to_sender boolean default false
)
returns table (
  success boolean,
  email_log_id uuid,
  recipient_email text,
  next_share_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trainer_id uuid;
  v_contact public.trainer_availability_contacts%rowtype;
  v_recipient_email text;
  v_reference_at timestamptz;
  v_log_id uuid;
  v_months text[];
  v_message text;
begin
  if v_user_id is null then
    raise exception 'Non authentifié.';
  end if;

  v_trainer_id := public.current_trainer_profile_id();
  if v_trainer_id is null then
    raise exception 'Profil formateur introuvable.';
  end if;

  select *
  into v_contact
  from public.trainer_availability_contacts
  where id = p_contact_id
    and trainer_id = v_trainer_id;

  if not found then
    raise exception 'Ce contact n''appartient pas à votre carnet.';
  end if;

  v_recipient_email := lower(btrim(coalesce(v_contact.email, '')));
  if v_recipient_email = '' then
    raise exception 'Ce contact n''a pas d''adresse e-mail valide.';
  end if;

  select coalesce(array_agg(month_key order by month_key), array[]::text[])
  into v_months
  from (
    select distinct btrim(value) as month_key
    from unnest(coalesce(p_months, array[]::text[])) as value
    where btrim(value) ~ '^\\d{4}-(0[1-9]|1[0-2])$'
  ) valid_months;

  if cardinality(v_months) = 0 or cardinality(v_months) > 6 then
    raise exception 'Sélectionnez entre 1 et 6 mois valides.';
  end if;

  v_message := left(btrim(coalesce(p_trainer_message, '')), 1500);

  -- Sérialise tous les envois pour un même couple formateur + e-mail,
  -- même si le contact du carnet a été supprimé puis recréé.
  perform pg_advisory_xact_lock(
    hashtextextended(v_trainer_id::text || '|' || v_recipient_email, 0)
  );

  select coalesce(e.sent_at, e.created_at)
  into v_reference_at
  from public.email_logs e
  where e.email_type = 'trainer_availability_share'
    and e.metadata ->> 'trainer_id' = v_trainer_id::text
    and lower(btrim(e.recipient_email)) = v_recipient_email
    and (
      e.status in ('sent', 'delivered', 'soft_bounce', 'hard_bounce', 'blocked', 'invalid', 'deferred')
      or (e.status = 'pending' and e.created_at >= now() - interval '15 minutes')
    )
  order by coalesce(e.sent_at, e.created_at) desc
  limit 1;

  if v_reference_at is not null
     and v_reference_at + interval '20 days' > now() then
    return query
    select
      false,
      null::uuid,
      v_recipient_email,
      v_reference_at + interval '20 days',
      'Un partage a déjà été envoyé récemment à ce contact.'::text;
    return;
  end if;

  insert into public.email_logs (
    email_type,
    provider,
    recipient_email,
    recipient_user_id,
    requested_by_user_id,
    organization_id,
    related_entity_type,
    related_entity_id,
    status,
    metadata
  ) values (
    'trainer_availability_share',
    'brevo',
    v_recipient_email,
    null,
    v_user_id,
    v_contact.organization_id,
    'trainer_availability_contact',
    v_contact.id,
    'pending',
    jsonb_build_object(
      'source', 'trainer_availability_share',
      'trainer_id', v_trainer_id,
      'contact_id', v_contact.id,
      'organization_name', v_contact.organization_name,
      'months', to_jsonb(v_months),
      'trainer_message', nullif(v_message, ''),
      'copy_to_sender', coalesce(p_copy_to_sender, false)
    )
  )
  returning id into v_log_id;

  return query
  select
    true,
    v_log_id,
    v_recipient_email,
    now() + interval '20 days',
    'Envoi réservé.'::text;
end;
$$;

revoke all
on function public.reserve_my_availability_share(uuid, text[], text, boolean)
from public;

revoke all
on function public.reserve_my_availability_share(uuid, text[], text, boolean)
from anon;

grant execute
on function public.reserve_my_availability_share(uuid, text[], text, boolean)
to authenticated;

create index if not exists email_logs_availability_share_lookup_idx
  on public.email_logs (
    lower(btrim(recipient_email)),
    created_at desc
  )
  where email_type = 'trainer_availability_share';
