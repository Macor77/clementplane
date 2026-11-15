-- V1.4.0: private expense lines; historical amounts/text retained verbatim.
begin;
alter table public.trainer_activity_private
  add column expense_items jsonb not null default '[]'::jsonb check(jsonb_typeof(expense_items)='array'),
  add column legacy_expenses numeric(10,2),
  add column legacy_expense_details text;
update public.trainer_activity_private set
  legacy_expenses=expenses, legacy_expense_details=expense_details,
  expense_items=jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'category','other',
    'amount_cents',case when expenses is null then null else (expenses*100)::bigint end,
    'details',case when expense_details ~ '[^[:space:]]' then expense_details else 'Frais saisis avant le détail par dépense.' end))
  where expenses is not null or expense_details ~ '[^[:space:]]';
comment on column public.trainer_activity_private.expense_items is 'Owner-only expense lines: UUID id, category code, integer amount_cents, details. Null cents only for preserved legacy text-only lines. No calendar sharing.';
comment on column public.trainer_activity_private.legacy_expenses is 'Immutable original global amount. Archive only, never add to line totals.';
comment on column public.trainer_activity_private.legacy_expense_details is 'Immutable original free text before expense lines, preserved verbatim.';
comment on column public.trainer_activity_private.expenses is 'Server-computed sum of known expense_items amounts. Original null/zero retained until next save; original value archived in legacy_expenses.';

create or replace function activity_private.expense_total(p_items jsonb,p_previous jsonb) returns numeric
language plpgsql security invoker set search_path='' as $$
declare item jsonb; ids uuid[]:='{}'; item_id uuid; cents numeric; total numeric:=0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'INVALID_EXPENSE_ITEMS'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(item) is distinct from 'object' or item-array['id','category','amount_cents','details']<>'{}'::jsonb
      or not (item ?& array['id','category','amount_cents','details']) then raise exception 'INVALID_EXPENSE_FIELDS'; end if;
    if jsonb_typeof(item->'id') is distinct from 'string' or item->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'INVALID_EXPENSE_ID'; end if;
    item_id:=(item->>'id')::uuid;
    if item_id=any(ids) then raise exception 'DUPLICATE_EXPENSE_ID'; end if;
    ids:=array_append(ids,item_id);
    if jsonb_typeof(item->'category') is distinct from 'string' or item->>'category' not in
      ('meals','accommodation','fuel','tolls','parking','public_transport','taxi','vehicle_rental','teaching_material','material_transport','other') then raise exception 'INVALID_EXPENSE_CATEGORY'; end if;
    if jsonb_typeof(item->'details') is distinct from 'string' or length(item->>'details')>5000 then raise exception 'INVALID_EXPENSE_DETAILS'; end if;
    if item->>'category'='other' and not (item->>'details' ~ '[^[:space:]]') then raise exception 'EXPENSE_DETAILS_REQUIRED'; end if;
    if item->'amount_cents'='null'::jsonb then
      -- Unknown legacy amounts may survive unrelated edits, never invent a zero.
      if not exists(select 1 from jsonb_array_elements(coalesce(p_previous,'[]'::jsonb)) old
        where (old->>'id')::uuid=item_id and old->'amount_cents'='null'::jsonb) then raise exception 'EXPENSE_AMOUNT_REQUIRED'; end if;
    else
      if jsonb_typeof(item->'amount_cents') is distinct from 'number' then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
      cents:=(item->>'amount_cents')::numeric;
      if cents<0 or cents>9999999999 or cents<>trunc(cents) then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
      total:=total+cents;
      if total>9999999999 then raise exception 'EXPENSE_TOTAL_TOO_LARGE'; end if;
    end if;
  end loop;
  return total/100;
end $$;
revoke all on function activity_private.expense_total(jsonb,jsonb) from public,anon,authenticated;

create or replace function activity_private.save_report(p_origin text,p_mission_id uuid,p_revision integer,p_mutation_id uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t uuid; r public.trainer_activity_reports%rowtype; source_fee jsonb; org uuid; saved_private public.trainer_activity_private%rowtype; k text; amount numeric; author_name text; title text; refs jsonb; anchor date; simple boolean; s jsonb; previous jsonb; expense_amount numeric;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  t:=public.current_trainer_profile_id();
  if t is null or p_mission_id is null or p_mutation_id is null or p_origin is null or p_origin not in ('personal','organization') then raise exception 'REPORT_ACCESS_DENIED'; end if;
  -- Serialize creation/retries for the same owner and mission, including concurrent first saves.
  perform pg_advisory_xact_lock(hashtextextended(t::text||p_origin||p_mission_id::text,0));
  select * into r from public.trainer_activity_reports where trainer_id=t and owner_user_id=auth.uid()
    and ((p_origin='personal' and personal_mission_id=p_mission_id) or (p_origin='organization' and mission_id=p_mission_id)) for update;
  if r.id is not null and r.last_mutation_id=p_mutation_id then
    select * into saved_private from public.trainer_activity_private where report_id=r.id;
    return jsonb_build_object('report',to_jsonb(r),'private',to_jsonb(saved_private));
  end if;
  if r.id is null then
    if p_revision is not null then raise exception 'REPORT_CONFLICT'; end if;
    if p_origin='personal' then
      select jsonb_build_object('amount',fee,'unit',fee_unit,'tax_basis',case when fee is null then null else 'HT' end) into source_fee
      from public.trainer_personal_missions where id=p_mission_id and trainer_id=t and owner_user_id=auth.uid();
    else
      select m.organization_id,jsonb_build_object('amount',m.cout_formateur,'unit',null,'tax_basis',null) into org,source_fee
      from public.missions m where m.id=p_mission_id and exists(select 1 from public.mission_formateurs mf where mf.mission_id=m.id and mf.formateur_id=t and mf.statut='affecte');
    end if;
    if source_fee is null then raise exception 'REPORT_ACCESS_DENIED'; end if;
  elsif p_revision is distinct from r.revision then raise exception 'REPORT_CONFLICT';
  end if;
  if not (p_data ? 'expense_items') then raise exception 'REPORT_APP_UPDATE_REQUIRED'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' or p_data - array['declared_fee','tax_basis','observations','sessions','expense_items','kilometers','difficulties','summary'] <> '{}'::jsonb then raise exception 'INVALID_REPORT_FIELDS'; end if;
  -- Validate raw JSON before numeric(10,2) can round sub-cent negative/precise inputs.
  foreach k in array array['declared_fee','kilometers'] loop
    if p_data->>k is not null then
      if jsonb_typeof(p_data->k)<>'number' then raise exception 'INVALID_AMOUNT'; end if;
      amount:=(p_data->>k)::numeric;
      if amount<0 or amount>99999999.99 or amount<>round(amount,2) then raise exception 'INVALID_AMOUNT'; end if;
    end if;
  end loop;
  foreach k in array array['observations','difficulties'] loop
    if p_data->>k is not null and jsonb_typeof(p_data->k)<>'string' then raise exception 'INVALID_REPORT_TEXT'; end if;
  end loop;
  select * into saved_private from public.trainer_activity_private where report_id=r.id;
  expense_amount:=activity_private.expense_total(p_data->'expense_items',saved_private.expense_items);
  simple:=p_data ? 'summary';
  if not simple and (r.id is null or r.report_mode='simple') then raise exception 'REPORT_APP_UPDATE_REQUIRED'; end if;
  if simple then
    if p_data ? 'sessions' then raise exception 'INVALID_REPORT_FIELDS'; end if;
    if r.id is not null and r.report_mode='detailed' and jsonb_array_length(r.sessions)>1 then raise exception 'MULTI_GROUP_REPORT_REQUIRES_DETAIL'; end if;
    if r.id is null or (r.report_mode='simple' and r.summary->>'status' in ('pending','not_done') and (
      (p_origin='personal' and exists(select 1 from public.trainer_personal_missions m where m.id=p_mission_id and m.owner_user_id=auth.uid() and m.trainer_id=t)) or
      (p_origin='organization' and exists(select 1 from public.mission_formateurs mf where mf.mission_id=p_mission_id and mf.formateur_id=t and mf.statut='affecte')))) then
      if p_origin='personal' then
        select coalesce(nullif(m.formation,''),m.title,''),coalesce((select jsonb_agg(distinct d->>'date' order by d->>'date') from jsonb_array_elements(m.dates) d),'[]'::jsonb)
          into title,refs from public.trainer_personal_missions m where m.id=p_mission_id;
      else
        select coalesce(nullif(m.formation,''),m.intitule,''),coalesce((select jsonb_agg(distinct d.date order by d.date) from public.mission_dates d where d.mission_id=m.id),'[]'::jsonb)
          into title,refs from public.missions m where m.id=p_mission_id;
      end if;
      anchor:=(refs->>0)::date;
    else
      title:=r.formation_title; refs:=r.reference_dates; anchor:=r.activity_date;
      if r.report_mode='detailed' then
        select coalesce(min((d->>'date')::date) filter(where d->>'status'='done'),min((d->>'date')::date)) into anchor
          from jsonb_array_elements(r.sessions) ss cross join lateral jsonb_array_elements(ss->'days') d;
      end if;
    end if;
    perform activity_private.validate_summary(p_data->'summary',refs);
  else
    perform activity_private.validate_sessions(p_data->'sessions');
    if jsonb_array_length(p_data->'sessions')<>jsonb_array_length(r.sessions) then raise exception 'REPORT_STRUCTURE_LOCKED'; end if;
    for s in select value from jsonb_array_elements(p_data->'sessions') loop
      select value into previous from jsonb_array_elements(r.sessions) where value->>'id'=s->>'id';
      if previous is null or (s - array['learner_count','days']) is distinct from (previous - array['learner_count','days']) then raise exception 'REPORT_STRUCTURE_LOCKED'; end if;
      if (select jsonb_agg(value - array['status','actual_hours'] order by value->>'date') from jsonb_array_elements(s->'days'))
        is distinct from (select jsonb_agg(value - array['status','actual_hours'] order by value->>'date') from jsonb_array_elements(previous->'days')) then raise exception 'REPORT_STRUCTURE_LOCKED'; end if;
    end loop;
  end if;
  if r.id is null then
    select left(trim(concat_ws(' ',prenom,nom)),200) into author_name from public.trainers where id=t;
    insert into public.trainer_activity_reports(owner_user_id,trainer_id,trainer_name,mission_id,personal_mission_id,organization_id,agreed_fee,declared_fee,tax_basis,observations,sessions,last_mutation_id,report_mode,summary,formation_title,reference_dates,activity_date)
    values(auth.uid(),t,coalesce(author_name,''),case when p_origin='organization' then p_mission_id end,case when p_origin='personal' then p_mission_id end,org,source_fee,
      (p_data->>'declared_fee')::numeric,p_data->>'tax_basis',coalesce(p_data->>'observations',''),'[]'::jsonb,p_mutation_id,'simple',p_data->'summary',coalesce(title,''),refs,anchor) returning * into r;
  else
    update public.trainer_activity_reports set declared_fee=(p_data->>'declared_fee')::numeric,tax_basis=p_data->>'tax_basis',observations=coalesce(p_data->>'observations',''),sessions=case when simple then sessions else p_data->'sessions' end,
      formation_title=case when simple then title else formation_title end, reference_dates=case when simple then refs else reference_dates end, activity_date=case when simple then anchor else activity_date end,
      report_mode=case when simple then 'simple' else report_mode end, summary=case when simple then p_data->'summary' else summary end,
      revision=revision+1,last_mutation_id=p_mutation_id,updated_at=clock_timestamp() where id=r.id returning * into r;
  end if;
  insert into public.trainer_activity_private(report_id,owner_user_id,expenses,expense_items,kilometers,difficulties)
  values(r.id,auth.uid(),expense_amount,p_data->'expense_items',(p_data->>'kilometers')::numeric,coalesce(p_data->>'difficulties',''))
  on conflict(report_id) do update set expenses=excluded.expenses,expense_items=excluded.expense_items,kilometers=excluded.kilometers,difficulties=excluded.difficulties returning * into saved_private;
  return jsonb_build_object('report',to_jsonb(r),'private',to_jsonb(saved_private));
end $$;
commit;
