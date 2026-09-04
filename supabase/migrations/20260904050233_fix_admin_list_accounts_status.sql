create or replace function public.admin_list_accounts()
returns table(
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
  if not public.is_platform_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.first_name,
    p.last_name,
    case
      when u.deleted_at is not null then 'deleted'
      when u.banned_until is not null and u.banned_until > now() then 'banned'
      else 'active'
    end as account_status,
    p.created_at,
    exists (
      select 1
      from public.organization_members om
      where om.user_id = p.id
        and om.status = 'active'
    ) as has_organization,
    (t.id is not null) as has_trainer,
    (
      select string_agg(o.name, ', ' order by o.name)
      from public.organization_members om
      join public.organizations o on o.id = om.organization_id
      where om.user_id = p.id
        and om.status = 'active'
    ) as organization_names,
    t.id
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.trainers t on t.user_id = p.id
  order by p.created_at desc;
end;
$$;
