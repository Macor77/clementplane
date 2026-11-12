-- V1.3 additive. No writes/triggers on missions, availability, notifications or calendars.
begin;
create schema if not exists activity_private;
revoke all on schema activity_private from public, anon;
grant usage on schema activity_private to authenticated;

create table public.trainer_activity_reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  personal_mission_id uuid references public.trainer_personal_missions(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  agreed_fee jsonb not null,
  declared_fee numeric(10,2) check (declared_fee >= 0 and declared_fee <= 99999999.99),
  tax_basis text check (tax_basis in ('HT','TTC')),
  observations text not null default '' check (length(observations) <= 5000),
  sessions jsonb not null,
  revision integer not null default 1,
  last_mutation_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(mission_id,personal_mission_id)=1),
  check ((mission_id is null) = (organization_id is null)),
  check ((declared_fee is null) = (tax_basis is null)),
  unique (trainer_id,mission_id), unique (trainer_id,personal_mission_id)
);
create table public.trainer_activity_private (
  report_id uuid primary key references public.trainer_activity_reports(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  expenses numeric(10,2) check (expenses >= 0 and expenses <= 99999999.99),
  expense_details text not null default '' check (length(expense_details)<=5000),
  kilometers numeric(10,2) check (kilometers>=0 and kilometers<=99999999.99),
  difficulties text not null default '' check (length(difficulties)<=5000)
);
create index trainer_activity_owner on public.trainer_activity_reports(owner_user_id);
create index trainer_activity_org on public.trainer_activity_reports(organization_id);
create index trainer_activity_private_owner on public.trainer_activity_private(owner_user_id);
alter table public.trainer_activity_reports enable row level security;
alter table public.trainer_activity_private enable row level security;
revoke all on public.trainer_activity_reports, public.trainer_activity_private from public,anon,authenticated;
grant select on public.trainer_activity_reports, public.trainer_activity_private to authenticated;
grant all on public.trainer_activity_reports, public.trainer_activity_private to service_role;
create policy activity_report_read on public.trainer_activity_reports for select to authenticated using (
  owner_user_id=(select auth.uid()) or
  (mission_id is not null and organization_id is not null and public.is_organization_member(organization_id))
);
create policy activity_private_read on public.trainer_activity_private for select to authenticated
using (owner_user_id=(select auth.uid()));

-- Reject unknown JSON fields: private notes cannot accidentally enter the shared envelope.
create function activity_private.validate_sessions(p_sessions jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare s jsonb; d jsonb; v date; ids uuid[]:='{}'; days date[]; sid uuid; n numeric;
begin
  if jsonb_typeof(p_sessions) is distinct from 'array' then raise exception 'INVALID_SESSIONS'; end if;
  if jsonb_array_length(p_sessions) not between 1 and 100 then raise exception 'INVALID_SESSIONS'; end if;
  for s in select value from jsonb_array_elements(p_sessions) loop
    if jsonb_typeof(s) is distinct from 'object' or s - array['id','formation','group_label','learner_count','expected_learners','days'] <> '{}'::jsonb then raise exception 'INVALID_SESSION_FIELDS'; end if;
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
revoke all on function activity_private.validate_sessions(jsonb) from public,anon,authenticated;

create function activity_private.save_report(p_origin text,p_mission_id uuid,p_revision integer,p_mutation_id uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t uuid; r public.trainer_activity_reports%rowtype; source_fee jsonb; org uuid; saved_private public.trainer_activity_private%rowtype;
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
  perform activity_private.validate_sessions(p_data->'sessions');
  if r.id is null then
    insert into public.trainer_activity_reports(owner_user_id,trainer_id,mission_id,personal_mission_id,organization_id,agreed_fee,declared_fee,tax_basis,observations,sessions,last_mutation_id)
    values(auth.uid(),t,case when p_origin='organization' then p_mission_id end,case when p_origin='personal' then p_mission_id end,org,source_fee,
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
revoke all on function activity_private.save_report(text,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function activity_private.save_report(text,uuid,integer,uuid,jsonb) to authenticated;
create function public.save_trainer_activity_report(p_origin text,p_mission_id uuid,p_revision integer,p_mutation_id uuid,p_data jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select activity_private.save_report(p_origin,p_mission_id,p_revision,p_mutation_id,p_data);
$$;
revoke all on function public.save_trainer_activity_report(text,uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.save_trainer_activity_report(text,uuid,integer,uuid,jsonb) to authenticated;
comment on table public.trainer_activity_reports is 'Trainer-declared activity. A report is neither a contract amendment, invoice nor organization acceptance.';
comment on table public.trainer_activity_private is 'Owner only. Never shared with an organization or external calendar.';
commit;
