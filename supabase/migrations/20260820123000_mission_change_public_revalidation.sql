-- Formaplane — Sprint 11.7
-- Revalidation publique sécurisée des modifications importantes.

alter table public.mission_change_request_trainers
  add column if not exists public_response_token uuid,
  add column if not exists public_link_created_at timestamptz;

create unique index if not exists mission_change_request_trainers_public_token_idx
  on public.mission_change_request_trainers(public_response_token)
  where public_response_token is not null;

create or replace function public.get_public_mission_change(p_token uuid)
returns table (
  request_id uuid,
  request_status text,
  response_status text,
  response_comment text,
  previous_status text,
  trainer_first_name text,
  trainer_has_account boolean,
  mission_id uuid,
  mission_title text,
  organization_name text,
  previous_mission jsonb,
  proposed_mission jsonb,
  previous_dates jsonb,
  proposed_dates jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.status,
    rt.response_status,
    rt.response_comment,
    rt.previous_status,
    t.prenom,
    (t.user_id is not null),
    m.id,
    coalesce(nullif(m.intitule, ''), nullif(m.formation, ''), 'Mission de formation'),
    coalesce(o.name, o.legal_name, 'Organisme de formation'),
    r.previous_mission,
    r.proposed_mission,
    r.previous_dates,
    r.proposed_dates
  from public.mission_change_request_trainers rt
  join public.mission_change_requests r on r.id = rt.change_request_id
  join public.trainers t on t.id = rt.trainer_id
  join public.missions m on m.id = r.mission_id
  join public.organizations o on o.id = r.organization_id
  where rt.public_response_token = p_token
  limit 1;
$$;

revoke all on function public.get_public_mission_change(uuid) from public;
grant execute on function public.get_public_mission_change(uuid) to anon, authenticated;

create or replace function public.respond_to_public_mission_change(
  p_token uuid,
  p_response text,
  p_comment text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.mission_change_request_trainers%rowtype;
  v_request public.mission_change_requests%rowtype;
  v_pending_count integer;
  v_trainer_name text;
begin
  if p_response not in ('accepted', 'refused') then
    raise exception 'INVALID_RESPONSE';
  end if;

  select * into v_target
  from public.mission_change_request_trainers rt
  where rt.public_response_token = p_token
  for update;

  if not found then raise exception 'CHANGE_NOT_FOUND'; end if;

  select * into v_request
  from public.mission_change_requests r
  where r.id = v_target.change_request_id
  for update;

  if v_request.status <> 'pending' or v_target.response_status <> 'pending' then
    raise exception 'CHANGE_ALREADY_RESPONDED';
  end if;

  update public.mission_change_request_trainers
  set response_status = p_response,
      response_comment = nullif(btrim(coalesce(p_comment, '')), ''),
      responded_at = now()
  where id = v_target.id;

  select nullif(btrim(concat_ws(' ', t.prenom, t.nom)), '')
  into v_trainer_name
  from public.trainers t
  where t.id = v_target.trainer_id;

  insert into public.mission_trainer_history (
    mission_id, trainer_id, mission_formateur_id,
    action, previous_status, new_status,
    actor_type, actor_display_name, details
  ) values (
    v_request.mission_id, v_target.trainer_id, v_target.mission_formateur_id,
    case when p_response = 'accepted' then 'change_accepted' else 'change_refused' end,
    v_target.previous_status, v_target.previous_status,
    'trainer', coalesce(v_trainer_name, 'Formateur'),
    jsonb_build_object(
      'change_request_id', v_request.id,
      'comment', nullif(btrim(coalesce(p_comment, '')), ''),
      'source', 'public_revalidation_link'
    )
  );

  if p_response = 'refused' then
    perform set_config('formaplane.actor_type', 'trainer', true);
    update public.mission_formateurs
    set statut = 'refuse',
        repondu_le = now(),
        response_comment = nullif(btrim(coalesce(p_comment, '')), ''),
        affecte_le = null
    where id = v_target.mission_formateur_id;
  end if;

  select count(*) into v_pending_count
  from public.mission_change_request_trainers rt
  where rt.change_request_id = v_request.id
    and rt.response_status = 'pending';

  if v_pending_count = 0 then
    update public.mission_change_requests
    set status = 'applied', resolved_at = now()
    where id = v_request.id;
  end if;

  perform public.reconcile_trainer_conflicts_safe(v_target.trainer_id);
  return p_response;
end;
$$;

revoke all on function public.respond_to_public_mission_change(uuid, text, text) from public;
grant execute on function public.respond_to_public_mission_change(uuid, text, text) to anon, authenticated;
