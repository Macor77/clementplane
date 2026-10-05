-- v0.21.1. Additive private missions. No notification, no writes to declared availability.
begin;
create table public.trainer_personal_missions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trainer_id uuid not null default public.current_trainer_profile_id() references public.trainers(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  formation text not null default '' check (length(formation)<=200),
  client_name text not null default '' check (length(client_name)<=200),
  location text not null default '' check (length(location)<=500),
  dates jsonb not null,
  private_notes text not null default '' check (length(private_notes)<=5000),
  fee numeric(10,2) check (fee>=0 and fee<=99999999.99),
  fee_unit text check (fee_unit in ('mission','day','hour')),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  revision integer not null default 1,
  check ((fee is null and fee_unit is null) or (fee is not null and fee_unit is not null))
);
create index trainer_personal_missions_owner on public.trainer_personal_missions(trainer_id,status);
alter table public.trainer_personal_missions enable row level security;
revoke all on public.trainer_personal_missions from public, anon, authenticated;
grant select on public.trainer_personal_missions to authenticated;
grant insert (id,title,formation,client_name,location,dates,private_notes,fee,fee_unit) on public.trainer_personal_missions to authenticated;
grant update (title,formation,client_name,location,dates,private_notes,fee,fee_unit,status) on public.trainer_personal_missions to authenticated;
grant all on public.trainer_personal_missions to service_role;
create policy personal_missions_read on public.trainer_personal_missions for select to authenticated
  using (owner_user_id=(select auth.uid()) and trainer_id=(select public.current_trainer_profile_id()));
create policy personal_missions_insert on public.trainer_personal_missions for insert to authenticated
  with check (owner_user_id=(select auth.uid()) and trainer_id=(select public.current_trainer_profile_id()));
create policy personal_missions_update on public.trainer_personal_missions for update to authenticated
  using (owner_user_id=(select auth.uid()) and trainer_id=(select public.current_trainer_profile_id()))
  with check (owner_user_id=(select auth.uid()) and trainer_id=(select public.current_trainer_profile_id()));

create function public.validate_personal_mission()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare d jsonb; v_day date; v_start text; v_end text; seen date[] := '{}';
begin
  if tg_op='UPDATE' then
    if new.owner_user_id<>old.owner_user_id or new.trainer_id<>old.trainer_id or new.id<>old.id then raise exception 'OWNER_IMMUTABLE'; end if;
    if old.status='cancelled' then raise exception 'MISSION_ALREADY_CANCELLED'; end if;
    new.created_at:=old.created_at;
    new.revision:=old.revision+1;
  else
    new.created_at:=now(); new.revision:=1;
  end if;
  new.updated_at:=clock_timestamp();
  new.cancelled_at:=case when new.status='cancelled' then clock_timestamp() else null end;
  if jsonb_typeof(new.dates) is distinct from 'array' then raise exception 'INVALID_DATES'; end if;
  if jsonb_array_length(new.dates) not between 1 and 100 then raise exception 'INVALID_DATES'; end if;
  for d in select value from jsonb_array_elements(new.dates) loop
    if jsonb_typeof(d) is distinct from 'object' or coalesce(d->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'INVALID_DATE'; end if;
    v_day:=(d->>'date')::date;
    if v_day not between date '2000-01-01' and date '2100-12-31' or v_day=any(seen) then raise exception 'INVALID_OR_DUPLICATE_DATE'; end if;
    seen:=array_append(seen,v_day);
    v_start:=nullif(d->>'heure_debut',''); v_end:=nullif(d->>'heure_fin','');
    if v_start is not null or v_end is not null then
      if v_start is null or v_end is null or v_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        or v_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or v_start>=v_end then raise exception 'INVALID_TIMES'; end if;
    end if;
  end loop;
  return new;
end; $$;
revoke all on function public.validate_personal_mission() from public, anon, authenticated;
create trigger validate_personal_mission before insert or update on public.trainer_personal_missions
  for each row execute function public.validate_personal_mission();

-- Existing RPC signatures preserved. No new endpoint can reveal personal details to an OF.
create or replace function public.get_my_trainer_commitments_with_mission(p_start_day date,p_end_day date)
returns table(day date,status text,mission_id uuid,mission_formateur_id uuid,mission_title text,organization_id uuid,organization_name text)
language sql stable security definer set search_path=public as $$
  select md.date,case when mf.statut='affecte' then 'mission' else 'option' end,
    m.id,mf.id,coalesce(nullif(m.intitule,''),nullif(m.formation,''),'Mission de formation'),o.id,o.name
  from public.trainers t join public.mission_formateurs mf on mf.formateur_id=t.id
  join public.missions m on m.id=mf.mission_id join public.mission_dates md on md.mission_id=m.id
  left join public.organizations o on o.id=m.organization_id
  where t.user_id=auth.uid() and mf.statut in ('accepte','affecte') and md.date between p_start_day and p_end_day
  union all
  select (d->>'date')::date,'mission',p.id,null::uuid,p.title,null::uuid,'Mission personnelle'::text
  from public.trainer_personal_missions p join public.trainers t on t.id=p.trainer_id
  cross join lateral jsonb_array_elements(p.dates) d
  where auth.uid() is not null and t.user_id=auth.uid() and p.owner_user_id=auth.uid() and p.status='confirmed'
    and (d->>'date')::date between p_start_day and p_end_day
  order by 1,2,3;
$$;
revoke all on function public.get_my_trainer_commitments_with_mission(date,date) from public,anon;
grant execute on function public.get_my_trainer_commitments_with_mission(date,date) to authenticated;

create or replace function public.get_trainer_mission_commitments_safe(
 p_trainer_ids uuid[],p_start_day date,p_end_day date,p_exclude_mission_id uuid default null,p_organization_id uuid default null)
returns table(mission_id uuid,formateur_id uuid,statut text,dates date[],is_own_organization boolean)
language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_organization_id is null or not public.is_organization_member(p_organization_id) then raise exception 'ORGANIZATION_ACCESS_DENIED'; end if;
 return query
 select case when m.organization_id=p_organization_id then mf.mission_id else null::uuid end,
   mf.formateur_id,mf.statut,array_agg(md.date order by md.date),(m.organization_id=p_organization_id)
 from public.mission_formateurs mf join public.missions m on m.id=mf.mission_id join public.mission_dates md on md.mission_id=m.id
 where mf.formateur_id=any(p_trainer_ids) and md.date between p_start_day and p_end_day
   and (p_exclude_mission_id is null or mf.mission_id<>p_exclude_mission_id)
   and ((m.organization_id=p_organization_id and mf.statut in ('accepte','affecte')) or (m.organization_id<>p_organization_id and mf.statut='affecte'))
 group by m.organization_id,mf.mission_id,mf.formateur_id,mf.statut
 union all
 -- One neutral aggregate per trainer, never a mission UUID or number of personal missions.
 select null::uuid,p.trainer_id,'affecte'::text,array_agg(distinct (d->>'date')::date order by (d->>'date')::date),false
 from public.trainer_personal_missions p cross join lateral jsonb_array_elements(p.dates) d
 where p.trainer_id=any(p_trainer_ids) and p.status='confirmed'
   and (d->>'date')::date between p_start_day and p_end_day
   and exists(select 1 from public.organization_trainers ot where ot.organization_id=p_organization_id and ot.trainer_id=p.trainer_id)
 group by p.trainer_id;
end; $$;
revoke all on function public.get_trainer_mission_commitments_safe(uuid[],date,date,uuid,uuid) from public,anon;
grant execute on function public.get_trainer_mission_commitments_safe(uuid[],date,date,uuid,uuid) to authenticated;
commit;
