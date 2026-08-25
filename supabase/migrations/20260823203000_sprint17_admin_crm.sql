-- Sprint 17.1 — Socle Admin Formaplane + mini-CRM

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- Amorçage du premier administrateur Formaplane.
-- L'insertion ne crée aucun compte : elle ne fait que rattacher un compte Auth existant.
insert into public.platform_admins (user_id)
select id from auth.users
where lower(email) in ('vincent.macor@alter-prevention.com', 'contact@formaplane.fr')
on conflict (user_id) do nothing;

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- Les admins Formaplane peuvent lire et piloter les demandes du mini-CRM.
drop policy if exists "support_requests_platform_admin_select" on public.support_requests;
create policy "support_requests_platform_admin_select"
on public.support_requests for select
to authenticated
using (public.is_platform_admin());

drop policy if exists "support_requests_platform_admin_update" on public.support_requests;
create policy "support_requests_platform_admin_update"
on public.support_requests for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

grant update (status, priority, internal_notes, assigned_to_user_id, first_response_at, resolved_at, closed_at)
on public.support_requests to authenticated;

create or replace function public.admin_list_support_requests()
returns table (
  id uuid,
  requester_user_id uuid,
  requester_email text,
  requester_first_name text,
  requester_last_name text,
  requester_profile text,
  source text,
  audience text,
  organization_id uuid,
  organization_name text,
  trainer_id uuid,
  trainer_name text,
  category text,
  category_key text,
  message text,
  app_version text,
  status text,
  priority text,
  internal_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  select sr.id, sr.requester_user_id, sr.requester_email, sr.requester_first_name,
    sr.requester_last_name, sr.requester_profile, sr.source, sr.audience,
    sr.organization_id, o.name,
    sr.trainer_id, nullif(btrim(concat_ws(' ', t.prenom, t.nom)), ''),
    sr.category, sr.category_key, sr.message, sr.app_version, sr.status, sr.priority,
    sr.internal_notes, sr.created_at, sr.updated_at
  from public.support_requests sr
  left join public.organizations o on o.id = sr.organization_id
  left join public.trainers t on t.id = sr.trainer_id
  order by sr.created_at desc;
end;
$$;

grant execute on function public.admin_list_support_requests() to authenticated;

create or replace function public.admin_update_support_request(
  p_id uuid,
  p_status text,
  p_priority text,
  p_internal_notes text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_status not in ('new','in_progress','resolved','closed') then raise exception 'INVALID_STATUS'; end if;
  if p_priority not in ('low','normal','high','urgent') then raise exception 'INVALID_PRIORITY'; end if;

  update public.support_requests
  set status = p_status,
      priority = p_priority,
      internal_notes = nullif(btrim(coalesce(p_internal_notes, '')), ''),
      first_response_at = case when p_status <> 'new' then coalesce(first_response_at, now()) else first_response_at end,
      resolved_at = case when p_status = 'resolved' then coalesce(resolved_at, now()) when p_status in ('new','in_progress') then null else resolved_at end,
      closed_at = case when p_status = 'closed' then coalesce(closed_at, now()) when p_status <> 'closed' then null else closed_at end
  where id = p_id;
end;
$$;

grant execute on function public.admin_update_support_request(uuid,text,text,text) to authenticated;

create or replace function public.admin_list_accounts()
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  account_status text,
  created_at timestamptz,
  has_organization boolean,
  has_trainer boolean,
  organization_names text,
  trainer_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  select p.id, u.email::text, p.first_name, p.last_name, p.account_status::text, p.created_at,
    exists(select 1 from public.organization_members om where om.user_id=p.id and om.status='active') as has_organization,
    (t.id is not null) as has_trainer,
    (select string_agg(o.name, ', ' order by o.name)
       from public.organization_members om join public.organizations o on o.id=om.organization_id
      where om.user_id=p.id and om.status='active') as organization_names,
    t.id
  from public.profiles p
  join auth.users u on u.id=p.id
  left join public.trainers t on t.user_id=p.id
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_accounts() to authenticated;

create or replace function public.admin_list_organizations()
returns table (
  id uuid,
  name text,
  status text,
  created_at timestamptz,
  member_count bigint,
  trainer_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  select o.id, o.name, o.status::text, o.created_at,
    (select count(*) from public.organization_members om where om.organization_id=o.id and om.status='active'),
    (select count(*) from public.organization_trainers ot where ot.organization_id=o.id)
  from public.organizations o
  order by o.created_at desc;
end;
$$;

grant execute on function public.admin_list_organizations() to authenticated;
