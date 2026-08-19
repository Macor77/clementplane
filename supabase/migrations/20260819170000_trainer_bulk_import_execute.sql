-- ==========================================================
-- FORMAPLANE — SPRINT 11.4.5
-- Import en masse atomique + idempotent
-- ==========================================================

create table if not exists public.trainer_bulk_import_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by_user_id uuid not null references auth.users(id) on delete cascade,
  client_token uuid not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint trainer_bulk_import_runs_token_unique unique (organization_id, client_token)
);

alter table public.trainer_bulk_import_runs enable row level security;
revoke all on table public.trainer_bulk_import_runs from anon, authenticated;

create or replace function public.execute_trainer_bulk_import(
  p_organization_id uuid,
  p_client_token uuid,
  p_rows jsonb,
  p_catalog_actions jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_result jsonb;
  v_row jsonb;
  v_action jsonb;
  v_trainer_id uuid;
  v_candidate_id uuid;
  v_claimed boolean;
  v_already_in_network boolean;
  v_line integer;
  v_email text;
  v_created integer := 0;
  v_attached integer := 0;
  v_synced integer := 0;
  v_catalog_created integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_catalog_details jsonb := '[]'::jsonb;
  v_name text;
  v_kind text;
  v_catalog_row record;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_client_token is null then raise exception 'IMPORT_TOKEN_REQUIRED'; end if;
  if not public.is_organization_member(p_organization_id) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  select result into v_existing_result
  from public.trainer_bulk_import_runs
  where organization_id = p_organization_id and client_token = p_client_token;

  if v_existing_result is not null then
    return v_existing_result;
  end if;

  insert into public.trainer_bulk_import_runs(
    organization_id, requested_by_user_id, client_token
  ) values (p_organization_id, v_user_id, p_client_token)
  on conflict (organization_id, client_token) do nothing;

  -- Référentiels : les créations sont faites dans la même transaction.
  for v_action in select value from jsonb_array_elements(coalesce(p_catalog_actions, '[]'::jsonb))
  loop
    if coalesce(v_action->>'action', '') <> 'create' then continue; end if;
    v_kind := v_action->>'type';
    v_name := nullif(btrim(v_action->>'name'), '');
    if v_name is null then raise exception 'CATALOG_NAME_REQUIRED'; end if;

    if v_kind = 'competency' then
      select * into v_catalog_row from public.add_competency_to_catalog(v_name);
    elsif v_kind = 'equipment' then
      select * into v_catalog_row from public.add_equipment_to_catalog(v_name);
    else
      raise exception 'UNKNOWN_CATALOG_TYPE';
    end if;

    v_catalog_created := v_catalog_created + 1;
    v_catalog_details := v_catalog_details || jsonb_build_array(jsonb_build_object(
      'type', v_kind, 'name', v_catalog_row.name
    ));
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  loop
    v_line := nullif(v_row->>'lineNumber', '')::integer;
    v_candidate_id := nullif(v_row->>'existingTrainerId', '')::uuid;
    v_email := lower(btrim(coalesce(v_row->>'email', '')));

    if nullif(btrim(coalesce(v_row->>'firstName','')), '') is null
       or nullif(btrim(coalesce(v_row->>'lastName','')), '') is null then
      raise exception 'NAME_REQUIRED_LINE_%', v_line;
    end if;

    if v_candidate_id is null then
      -- Protection ultime contre un doublon e-mail au moment exact de l'écriture.
      if v_email <> '' and exists (
        select 1 from public.trainers t
        where lower(btrim(coalesce(t.email,''))) = v_email
      ) then
        raise exception 'DUPLICATE_EMAIL_LINE_%', v_line;
      end if;

      v_trainer_id := public.create_trainer_for_organization(
        p_organization_id,
        v_row->>'firstName', v_row->>'lastName',
        coalesce(array(select jsonb_array_elements_text(coalesce(v_row->'competencies','[]'::jsonb))), '{}'::text[]),
        coalesce(array(select jsonb_array_elements_text(coalesce(v_row->'equipment','[]'::jsonb))), '{}'::text[]),
        nullif(v_row->>'phone',''), nullif(v_row->>'email',''),
        nullif(v_row->>'city',''), nullif(v_row->>'postalCode',''),
        null, null,
        coalesce(nullif(v_row->>'status',''),'Standard'),
        nullif(v_row->>'tariff','')::numeric,
        nullif(v_row->>'notes','')
      );
      v_created := v_created + 1;
      v_details := v_details || jsonb_build_array(jsonb_build_object(
        'lineNumber', v_line, 'trainerId', v_trainer_id, 'action', 'created',
        'name', concat_ws(' ', v_row->>'firstName', v_row->>'lastName')
      ));
      continue;
    end if;

    select (t.user_id is not null) into v_claimed
    from public.trainers t where t.id = v_candidate_id;
    if not found then raise exception 'TRAINER_NOT_FOUND_LINE_%', v_line; end if;

    select exists(
      select 1 from public.organization_trainers ot
      where ot.organization_id = p_organization_id and ot.trainer_id = v_candidate_id
    ) into v_already_in_network;

    if not v_already_in_network then
      insert into public.organization_trainers(
        organization_id, trainer_id, statut, tarif, notes, ville, code_postal, created_by_user_id
      ) values (
        p_organization_id, v_candidate_id,
        coalesce(nullif(v_row->>'status',''),'Standard'),
        nullif(v_row->>'tariff','')::numeric,
        nullif(v_row->>'notes',''), nullif(v_row->>'city',''), nullif(v_row->>'postalCode',''), v_user_id
      );
      v_attached := v_attached + 1;
    end if;

    if not v_claimed then
      perform public.update_unclaimed_trainer_for_organization(
        p_organization_id, v_candidate_id,
        v_row->>'firstName', v_row->>'lastName',
        coalesce(array(select jsonb_array_elements_text(coalesce(v_row->'competencies','[]'::jsonb))), '{}'::text[]),
        coalesce(array(select jsonb_array_elements_text(coalesce(v_row->'equipment','[]'::jsonb))), '{}'::text[]),
        nullif(v_row->>'phone',''), nullif(v_row->>'email',''),
        nullif(v_row->>'city',''), nullif(v_row->>'postalCode',''), null, null,
        coalesce(nullif(v_row->>'status',''),'Standard'),
        nullif(v_row->>'tariff','')::numeric, nullif(v_row->>'notes','')
      );
      v_synced := v_synced + 1;
    else
      -- Fiche revendiquée : jamais de modification des données globales du formateur.
      update public.organization_trainers set
        statut = coalesce(nullif(v_row->>'status',''),'Standard'),
        tarif = nullif(v_row->>'tariff','')::numeric,
        notes = nullif(v_row->>'notes',''),
        ville = nullif(v_row->>'city',''),
        code_postal = nullif(v_row->>'postalCode','')
      where organization_id = p_organization_id and trainer_id = v_candidate_id;
    end if;

    v_details := v_details || jsonb_build_array(jsonb_build_object(
      'lineNumber', v_line, 'trainerId', v_candidate_id,
      'action', case when v_already_in_network then 'synchronized' else 'attached' end,
      'claimed', v_claimed,
      'name', concat_ws(' ', v_row->>'firstName', v_row->>'lastName')
    ));
  end loop;

  v_existing_result := jsonb_build_object(
    'success', true,
    'created', v_created,
    'attached', v_attached,
    'synchronized', v_synced,
    'catalogCreated', v_catalog_created,
    'details', v_details,
    'catalogDetails', v_catalog_details,
    'completedAt', now()
  );

  update public.trainer_bulk_import_runs
  set result = v_existing_result, completed_at = now()
  where organization_id = p_organization_id and client_token = p_client_token;

  return v_existing_result;
end;
$$;

revoke all on function public.execute_trainer_bulk_import(uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.execute_trainer_bulk_import(uuid, uuid, jsonb, jsonb) to authenticated;
