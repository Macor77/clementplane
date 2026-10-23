-- Record an agreement received outside Clementplane, never impersonate the trainer.
create or replace function public.confirm_mission_change_for_organization(
  p_request_id uuid, p_trainer_id uuid, p_channel text, p_note text default null
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_request public.mission_change_requests%rowtype;
  v_target public.mission_change_request_trainers%rowtype;
  v_relation public.mission_formateurs%rowtype;
  v_mission public.missions%rowtype;
  v_actor text;
  v_org text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_request from public.mission_change_requests where id = p_request_id;
  if not found then raise exception 'CHANGE_NOT_FOUND'; end if;
  if not exists(select 1 from public.organization_members
    where organization_id = v_request.organization_id and user_id = v_user and status = 'active')
    then raise exception 'FORBIDDEN'; end if;
  if p_channel is null or p_channel not in ('email','sms','whatsapp','phone','other') then
    raise exception 'INVALID_CHANNEL'; end if;
  if p_channel = 'other' and nullif(btrim(p_note),'') is null then
    raise exception 'CONTACT_NOTE_REQUIRED'; end if;
  if length(coalesce(p_note,'')) > 2000 then raise exception 'CONTACT_NOTE_TOO_LONG'; end if;

  -- Same lock order as the existing trainer/public response RPCs.
  select * into v_target from public.mission_change_request_trainers
    where change_request_id = p_request_id and trainer_id = p_trainer_id for update;
  if not found then raise exception 'CHANGE_NOT_FOUND'; end if;
  select * into v_request from public.mission_change_requests where id = p_request_id for update;
  if v_request.status <> 'pending' or v_target.response_status <> 'pending' then
    raise exception 'CHANGE_ALREADY_RESPONDED'; end if;
  select * into v_mission from public.missions where id = v_request.mission_id for share;
  if not found or v_mission.statut = 'annulee' or v_mission.organization_id is distinct from v_request.organization_id then
    raise exception 'MISSION_NO_LONGER_AVAILABLE'; end if;
  select * into v_relation from public.mission_formateurs where id = v_target.mission_formateur_id for share;
  if not found or v_relation.mission_id is distinct from v_request.mission_id
    or v_relation.formateur_id is distinct from p_trainer_id
    or v_relation.statut is null or v_relation.statut not in ('accepte','affecte','indisponible_affecte_ailleurs') then
    raise exception 'MISSION_NO_LONGER_AVAILABLE'; end if;

  update public.mission_change_request_trainers set response_status = 'accepted',
    responded_at = now(), response_comment = nullif(btrim(p_note),'') where id = v_target.id;
  select nullif(btrim(concat_ws(' ',first_name,last_name)),'') into v_actor from public.profiles where id = v_user;
  select coalesce(name,legal_name) into v_org from public.organizations where id = v_request.organization_id;
  insert into public.mission_trainer_history (
    mission_id,trainer_id,mission_formateur_id,action,previous_status,new_status,
    actor_user_id,actor_type,actor_display_name,actor_organization_id,actor_organization_name,details
  ) values (
    v_request.mission_id,p_trainer_id,v_target.mission_formateur_id,'change_accepted',v_relation.statut,v_relation.statut,
    v_user,'organization',coalesce(v_actor,'Utilisateur'),v_request.organization_id,v_org,
    jsonb_build_object('change_request_id',p_request_id,'source','organization_manual_confirmation',
      'channel',p_channel,'comment',nullif(btrim(p_note),''))
  );
  if not exists(select 1 from public.mission_change_request_trainers
    where change_request_id = p_request_id and response_status = 'pending') then
    update public.mission_change_requests set status = 'applied', resolved_at = now() where id = p_request_id;
  end if;
  return 'accepted';
end;
$$;
revoke all on function public.confirm_mission_change_for_organization(uuid,uuid,text,text) from public, anon;
grant execute on function public.confirm_mission_change_for_organization(uuid,uuid,text,text) to authenticated;
