create or replace function public.get_my_account_deletion_status()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org record;
begin
  if v_user_id is null then raise exception 'Utilisateur non authentifié'; end if;

  select o.id, o.name into v_org
  from public.organization_members mine
  join public.organizations o on o.id = mine.organization_id
  where mine.user_id = v_user_id and mine.status = 'active'
    and not exists (
      select 1 from public.organization_members m
      where m.organization_id = mine.organization_id
        and m.user_id <> v_user_id and m.status = 'active'
    )
  limit 1;

  if found then
    return jsonb_build_object('allowed', false, 'reason', 'last_active_member',
      'organization_id', v_org.id, 'organization_name', v_org.name);
  end if;

  select o.id, o.name into v_org
  from public.organization_members mine
  join public.organizations o on o.id = mine.organization_id
  where mine.user_id = v_user_id and mine.status = 'active' and mine.role = 'owner'
    and not exists (
      select 1 from public.organization_members m
      where m.organization_id = mine.organization_id
        and m.user_id <> v_user_id and m.status = 'active' and m.role = 'owner'
    )
  limit 1;

  if found then
    return jsonb_build_object('allowed', false, 'reason', 'last_active_owner',
      'organization_id', v_org.id, 'organization_name', v_org.name);
  end if;

  return jsonb_build_object('allowed', true, 'reason', null);
end;
$$;

revoke all on function public.get_my_account_deletion_status() from public;
grant execute on function public.get_my_account_deletion_status() to authenticated;
