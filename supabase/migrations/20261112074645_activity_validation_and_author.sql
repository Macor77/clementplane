-- Additive review correction. Keep previously applied migrations unchanged.
begin;
alter table public.trainer_activity_reports add column trainer_name text not null default '' check(length(trainer_name)<=200);
update public.trainer_activity_reports r set trainer_name=left(trim(concat_ws(' ',t.prenom,t.nom)),200) from public.trainers t where t.id=r.trainer_id;
comment on column public.trainer_activity_reports.trainer_name is 'Server-controlled author snapshot for historical OF reports.';
create or replace function activity_private.validate_sessions(p_sessions jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare s jsonb; d jsonb; v date; ids uuid[]:='{}'; days date[]; sid uuid; n numeric;
begin
  if jsonb_typeof(p_sessions) is distinct from 'array' then raise exception 'INVALID_SESSIONS'; end if;
  if jsonb_array_length(p_sessions) not between 1 and 100 then raise exception 'INVALID_SESSIONS'; end if;
  for s in select value from jsonb_array_elements(p_sessions) loop
    if jsonb_typeof(s) is distinct from 'object' or s - array['id','formation','group_label','learner_count','expected_learners','days'] <> '{}'::jsonb then raise exception 'INVALID_SESSION_FIELDS'; end if;
    if exists(select 1 from unnest(array['learner_count','expected_learners']) key where s->>key is not null and jsonb_typeof(s->key)<>'number') then raise exception 'INVALID_LEARNER_COUNT'; end if;
    sid:=(s->>'id')::uuid;
    if sid is null or sid=any(ids) then raise exception 'INVALID_SESSION_ID'; end if;
    ids:=array_append(ids,sid);
    if jsonb_typeof(s->'formation') is distinct from 'string' or length(s->>'formation')>200 or jsonb_typeof(s->'group_label') is distinct from 'string' or length(s->>'group_label')>200 then raise exception 'INVALID_SESSION_LABEL'; end if;
    for n in select (s->>key)::numeric from unnest(array['learner_count','expected_learners']) key where s->>key is not null loop
      if n<0 or n>100000 or n<>trunc(n) then raise exception 'INVALID_LEARNER_COUNT'; end if;
    end loop;
    if jsonb_typeof(s->'days') is distinct from 'array' then raise exception 'INVALID_DAYS'; end if;
    if jsonb_array_length(s->'days') not between 1 and 100 then raise exception 'INVALID_DAYS'; end if;
    days:='{}';
    for d in select value from jsonb_array_elements(s->'days') loop
      if jsonb_typeof(d) is distinct from 'object' or d - array['date','status','actual_hours','planned_hours'] <> '{}'::jsonb then raise exception 'INVALID_DAY_FIELDS'; end if;
      if exists(select 1 from unnest(array['actual_hours','planned_hours']) key where d->>key is not null and jsonb_typeof(d->key)<>'number') then raise exception 'INVALID_HOURS'; end if;
      v:=(d->>'date')::date;
      if v is null or (d->>'date') !~ '^\d{4}-\d{2}-\d{2}$' or v<'2000-01-01' or v>'2100-12-31' or v=any(days) then raise exception 'INVALID_DAY'; end if;
      days:=array_append(days,v);
      if (d->>'status') is null or (d->>'status') not in ('pending','done','not_done') then raise exception 'INVALID_DAY_STATUS'; end if;
      if d->>'status'='done' and v>(now() at time zone 'Europe/Paris')::date then raise exception 'FUTURE_REALIZATION'; end if;
      for n in select (d->>key)::numeric from unnest(array['actual_hours','planned_hours']) key where d->>key is not null loop
        if n<0 or n>24 or n<>round(n,2) then raise exception 'INVALID_HOURS'; end if;
      end loop;
      if d->>'status'<>'done' and d->>'actual_hours' is not null then raise exception 'HOURS_WITHOUT_REALIZATION'; end if;
    end loop;
  end loop;
end $$;
create or replace function activity_private.save_report(p_origin text,p_mission_id uuid,p_revision integer,p_mutation_id uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t uuid; r public.trainer_activity_reports%rowtype; source_fee jsonb; org uuid; saved_private public.trainer_activity_private%rowtype; k text; amount numeric; author_name text;
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
  if jsonb_typeof(p_data) is distinct from 'object' or p_data - array['declared_fee','tax_basis','observations','sessions','expenses','expense_details','kilometers','difficulties'] <> '{}'::jsonb then raise exception 'INVALID_REPORT_FIELDS'; end if;
  -- Validate raw JSON before numeric(10,2) can round sub-cent negative/precise inputs.
  foreach k in array array['declared_fee','expenses','kilometers'] loop
    if p_data->>k is not null then
      if jsonb_typeof(p_data->k)<>'number' then raise exception 'INVALID_AMOUNT'; end if;
      amount:=(p_data->>k)::numeric;
      if amount<0 or amount>99999999.99 or amount<>round(amount,2) then raise exception 'INVALID_AMOUNT'; end if;
    end if;
  end loop;
  foreach k in array array['observations','expense_details','difficulties'] loop
    if p_data->>k is not null and jsonb_typeof(p_data->k)<>'string' then raise exception 'INVALID_REPORT_TEXT'; end if;
  end loop;
  perform activity_private.validate_sessions(p_data->'sessions');
  if r.id is null then
    select left(trim(concat_ws(' ',prenom,nom)),200) into author_name from public.trainers where id=t;
    insert into public.trainer_activity_reports(owner_user_id,trainer_id,trainer_name,mission_id,personal_mission_id,organization_id,agreed_fee,declared_fee,tax_basis,observations,sessions,last_mutation_id)
    values(auth.uid(),t,coalesce(author_name,''),case when p_origin='organization' then p_mission_id end,case when p_origin='personal' then p_mission_id end,org,source_fee,
      (p_data->>'declared_fee')::numeric,p_data->>'tax_basis',coalesce(p_data->>'observations',''),p_data->'sessions',p_mutation_id) returning * into r;
  else
    update public.trainer_activity_reports set declared_fee=(p_data->>'declared_fee')::numeric,tax_basis=p_data->>'tax_basis',observations=coalesce(p_data->>'observations',''),sessions=p_data->'sessions',
      revision=revision+1,last_mutation_id=p_mutation_id,updated_at=clock_timestamp() where id=r.id returning * into r;
  end if;
  insert into public.trainer_activity_private(report_id,owner_user_id,expenses,expense_details,kilometers,difficulties)
  values(r.id,auth.uid(),(p_data->>'expenses')::numeric,coalesce(p_data->>'expense_details',''),(p_data->>'kilometers')::numeric,coalesce(p_data->>'difficulties',''))
  on conflict(report_id) do update set expenses=excluded.expenses,expense_details=excluded.expense_details,kilometers=excluded.kilometers,difficulties=excluded.difficulties returning * into saved_private;
  return jsonb_build_object('report',to_jsonb(r),'private',to_jsonb(saved_private));
end $$;
commit;
