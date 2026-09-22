-- Bibliothèque de tutoriels — suivi minimal des ouvertures, étapes, téléchargements et fins de parcours.
-- Les détails sont limités aux identifiants de tutoriel et numéros d'étape ; aucune donnée saisie par l'utilisateur.

create or replace function public.track_product_event(
  p_event_name text,
  p_context text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_access_mode text;
  v_tutorial_id text;
  v_step integer;
  v_total_steps integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_name not in (
    'organization_dashboard_viewed','trainer_dashboard_viewed','trainer_search_viewed',
    'missions_viewed','planning_viewed','availability_viewed','availability_share_viewed',
    'proposals_viewed','discover_viewed','client_error','app_opened','tutorial_interaction'
  ) then raise exception 'INVALID_EVENT'; end if;

  if p_event_name = 'app_opened' then
    v_access_mode := coalesce(p_metadata->>'access_mode', p_context);
    if v_access_mode not in ('pwa','browser') then
      raise exception 'INVALID_ACCESS_MODE';
    end if;
  end if;

  if p_event_name = 'tutorial_interaction' then
    if coalesce(p_metadata->>'action', '') not in ('open','step','download','complete') then
      raise exception 'INVALID_TUTORIAL_ACTION';
    end if;

    v_tutorial_id := coalesce(p_metadata->>'tutorial_id', '');
    if v_tutorial_id not in (
      'create-mission','search-trainer','propose-mission','respond-to-proposal',
      'finalize-assignment','accept-and-assign','organization-planning',
      'follow-missions','import-trainers','manage-account','find-help'
    ) then raise exception 'INVALID_TUTORIAL'; end if;

    v_step := coalesce((p_metadata->>'step')::integer, 0);
    v_total_steps := coalesce((p_metadata->>'total_steps')::integer, 0);
    if v_total_steps < 1 or v_total_steps > 7 then
      raise exception 'INVALID_TUTORIAL_TOTAL';
    end if;
    if v_step < 1 or v_step > v_total_steps then
      raise exception 'INVALID_TUTORIAL_STEP';
    end if;

    p_metadata := jsonb_build_object(
      'action', p_metadata->>'action',
      'tutorial_id', v_tutorial_id,
      'step', v_step,
      'total_steps', v_total_steps
    );
  end if;

  insert into public.product_events(user_id,event_name,context,metadata)
  values(
    auth.uid(),
    p_event_name,
    left(nullif(btrim(coalesce(p_context,'')),''),120),
    coalesce(p_metadata,'{}'::jsonb)
  );
end;
$$;

revoke execute on function public.track_product_event(text,text,jsonb) from public;
revoke execute on function public.track_product_event(text,text,jsonb) from anon;
grant execute on function public.track_product_event(text,text,jsonb) to authenticated;
