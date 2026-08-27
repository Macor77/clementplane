-- Formaplane — Sprint 11.7.4
-- Historisation multicanale de l'information des formateurs
-- lors d'une modification importante.

create or replace function public.record_mission_change_contact(
  p_request_id uuid,
  p_channel text,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.mission_change_requests%rowtype;
  v_organization_name text;
  v_actor_name text;
  v_target record;
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentification requise.';
  end if;

  if p_channel not in (
    'email',
    'sms',
    'whatsapp',
    'phone',
    'other'
  ) then
    raise exception 'Canal de contact non reconnu.';
  end if;

  if
    p_channel = 'other'
    and nullif(
      btrim(coalesce(p_note, '')),
      ''
    ) is null
  then
    raise exception 'Précisez le moyen de contact utilisé.';
  end if;

  select *
  into v_request
  from public.mission_change_requests r
  where r.id = p_request_id;

  if not found then
    raise exception 'Demande de revalidation introuvable.';
  end if;

  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id =
      v_request.organization_id
      and om.user_id = v_user_id
      and om.status = 'active'
  ) then
    raise exception 'Vous n’avez pas accès à cette mission.';
  end if;

  select
    coalesce(o.name, o.legal_name),
    nullif(
      btrim(
        concat_ws(
          ' ',
          p.first_name,
          p.last_name
        )
      ),
      ''
    )
  into
    v_organization_name,
    v_actor_name
  from public.organizations o
  left join public.profiles p
    on p.id = v_user_id
  where o.id = v_request.organization_id;

  for v_target in
    select
      rt.trainer_id,
      rt.mission_formateur_id,
      rt.previous_status
    from public.mission_change_request_trainers rt
    where rt.change_request_id = p_request_id
  loop
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
      actor_organization_name,
      details
    )
    values (
      v_request.mission_id,
      v_target.trainer_id,
      v_target.mission_formateur_id,
      'change_contact',
      v_target.previous_status,
      v_target.previous_status,
      v_user_id,
      'organization',
      coalesce(
        v_actor_name,
        'Utilisateur'
      ),
      v_request.organization_id,
      v_organization_name,
      jsonb_build_object(
        'channel',
        p_channel,
        'note',
        nullif(
          btrim(coalesce(p_note, '')),
          ''
        ),
        'change_request_id',
        p_request_id
      )
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all
on function public.record_mission_change_contact(
  uuid,
  text,
  text
)
from public;

grant execute
on function public.record_mission_change_contact(
  uuid,
  text,
  text
)
to authenticated;
