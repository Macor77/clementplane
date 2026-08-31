-- Sprint 20.6 — registre interne des améliorations, réservé à l'administrateur.

create table if not exists public.admin_improvement_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null check (char_length(btrim(description)) between 1 and 10000),
  origin text check (origin is null or char_length(btrim(origin)) between 1 and 300),
  category text not null check (category in ('bug', 'improvement', 'idea', 'other')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'blocking')),
  status text not null default 'to_do' check (status in ('to_do', 'completed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.admin_improvement_items enable row level security;
revoke all on table public.admin_improvement_items from anon, authenticated;

create or replace function public.admin_list_improvement_items()
returns setof public.admin_improvement_items
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
    select item.*
    from public.admin_improvement_items item
    order by item.created_at desc;
end;
$$;

create or replace function public.admin_create_improvement_item(
  p_title text,
  p_description text,
  p_origin text,
  p_category text,
  p_priority text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if nullif(btrim(p_title), '') is null then raise exception 'TITLE_REQUIRED'; end if;
  if nullif(btrim(p_description), '') is null then raise exception 'DESCRIPTION_REQUIRED'; end if;
  if p_category not in ('bug', 'improvement', 'idea', 'other') then raise exception 'INVALID_CATEGORY'; end if;
  if p_priority not in ('low', 'normal', 'high', 'blocking') then raise exception 'INVALID_PRIORITY'; end if;

  insert into public.admin_improvement_items
    (title, description, origin, category, priority, created_by)
  values
    (btrim(p_title), btrim(p_description), nullif(btrim(p_origin), ''), p_category, p_priority, auth.uid())
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function public.admin_update_improvement_item(
  p_id uuid,
  p_title text,
  p_description text,
  p_origin text,
  p_category text,
  p_priority text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if nullif(btrim(p_title), '') is null then raise exception 'TITLE_REQUIRED'; end if;
  if nullif(btrim(p_description), '') is null then raise exception 'DESCRIPTION_REQUIRED'; end if;
  if p_category not in ('bug', 'improvement', 'idea', 'other') then raise exception 'INVALID_CATEGORY'; end if;
  if p_priority not in ('low', 'normal', 'high', 'blocking') then raise exception 'INVALID_PRIORITY'; end if;
  if p_status not in ('to_do', 'completed') then raise exception 'INVALID_STATUS'; end if;

  update public.admin_improvement_items
  set title = btrim(p_title),
      description = btrim(p_description),
      origin = nullif(btrim(p_origin), ''),
      category = p_category,
      priority = p_priority,
      status = p_status,
      updated_at = now(),
      completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end
  where id = p_id;

  if not found then raise exception 'IMPROVEMENT_ITEM_NOT_FOUND'; end if;
end;
$$;

create or replace function public.admin_delete_improvement_item(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  delete from public.admin_improvement_items where id = p_id;
  if not found then raise exception 'IMPROVEMENT_ITEM_NOT_FOUND'; end if;
end;
$$;

revoke all on function public.admin_list_improvement_items() from public, anon;
revoke all on function public.admin_create_improvement_item(text,text,text,text,text) from public, anon;
revoke all on function public.admin_update_improvement_item(uuid,text,text,text,text,text,text) from public, anon;
revoke all on function public.admin_delete_improvement_item(uuid) from public, anon;

grant execute on function public.admin_list_improvement_items() to authenticated;
grant execute on function public.admin_create_improvement_item(text,text,text,text,text) to authenticated;
grant execute on function public.admin_update_improvement_item(uuid,text,text,text,text,text,text) to authenticated;
grant execute on function public.admin_delete_improvement_item(uuid) to authenticated;
