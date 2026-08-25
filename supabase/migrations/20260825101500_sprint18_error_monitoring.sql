-- Sprint 18 — instrumentation légère des erreurs applicatives authentifiées.
-- Les erreurs sont stockées dans product_events, déjà protégé par RLS et accessible uniquement via RPC.

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
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_name not in (
    'organization_dashboard_viewed','trainer_dashboard_viewed','trainer_search_viewed',
    'missions_viewed','planning_viewed','availability_viewed','availability_share_viewed',
    'proposals_viewed','discover_viewed','client_error'
  ) then raise exception 'INVALID_EVENT'; end if;

  insert into public.product_events(user_id,event_name,context,metadata)
  values(
    auth.uid(),
    p_event_name,
    left(nullif(btrim(coalesce(p_context,'')),''),120),
    coalesce(p_metadata,'{}'::jsonb)
  );
end;
$$;

grant execute on function public.track_product_event(text,text,jsonb) to authenticated;
