-- v0.21.1. Structure personal mission locations like organization missions.
begin;

alter table public.trainer_personal_missions
  add column site_name text not null default '',
  add column address text not null default '',
  add column postal_code text not null default '',
  add column city text not null default '';

alter table public.trainer_personal_missions
  add constraint trainer_personal_missions_site_name_length check (length(site_name) <= 200),
  add constraint trainer_personal_missions_address_length check (length(address) <= 300),
  add constraint trainer_personal_missions_postal_code_required check (length(btrim(postal_code)) between 1 and 20) not valid,
  add constraint trainer_personal_missions_city_required check (length(btrim(city)) between 1 and 200) not valid;

grant insert (site_name,address,postal_code,city)
  on public.trainer_personal_missions to authenticated;
grant update (site_name,address,postal_code,city)
  on public.trainer_personal_missions to authenticated;

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
  select (d->>'date')::date,'mission',p.id,null::uuid,
    coalesce(nullif(p.formation,''),nullif(p.title,''),'Mission de formation'),null::uuid,'Mission personnelle'::text
  from public.trainer_personal_missions p join public.trainers t on t.id=p.trainer_id
  cross join lateral jsonb_array_elements(p.dates) d
  where auth.uid() is not null and t.user_id=auth.uid() and p.owner_user_id=auth.uid() and p.status='confirmed'
    and (d->>'date')::date between p_start_day and p_end_day
  order by 1,2,3;
$$;

revoke all on function public.get_my_trainer_commitments_with_mission(date,date) from public,anon;
grant execute on function public.get_my_trainer_commitments_with_mission(date,date) to authenticated;

commit;
