-- Sprint 15 — Structuration des demandes pour le futur outil de pilotage

create table if not exists public.support_request_categories (
  key text primary key,
  label text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint support_request_categories_key_not_blank check (btrim(key) <> ''),
  constraint support_request_categories_label_not_blank check (btrim(label) <> '')
);

insert into public.support_request_categories (key, label, sort_order)
values
  ('general_question', 'Question sur Formaplane', 10),
  ('technical_issue', 'Problème technique', 20),
  ('account_question', 'Question sur mon compte', 30),
  ('feature_request', 'Suggestion d’amélioration', 40),
  ('privacy_data', 'Confidentialité / données', 50),
  ('other', 'Autre demande', 90)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true;

alter table public.support_requests
  add column if not exists category_key text,
  add column if not exists requester_profile text,
  add column if not exists priority text not null default 'normal',
  add column if not exists assigned_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists tags text[] not null default '{}',
  add column if not exists first_response_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz;

update public.support_requests
set category_key = case
  when category = 'Question sur Formaplane' then 'general_question'
  when category = 'Problème technique' then 'technical_issue'
  when category = 'Question sur mon compte' then 'account_question'
  when category = 'Suggestion d’amélioration' then 'feature_request'
  when category = 'Confidentialité / données' then 'privacy_data'
  else 'other'
end
where category_key is null;

update public.support_requests sr
set requester_profile = case
  when exists (
    select 1
    from public.organization_members om
    where om.user_id = sr.requester_user_id
  ) and exists (
    select 1
    from public.trainers t
    where t.user_id = sr.requester_user_id
  ) then 'both'
  when exists (
    select 1
    from public.trainers t
    where t.user_id = sr.requester_user_id
  ) then 'trainer'
  else 'organization'
end
where requester_profile is null;

alter table public.support_requests
  alter column category_key set not null,
  alter column requester_profile set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_requests_category_key_fkey'
      and conrelid = 'public.support_requests'::regclass
  ) then
    alter table public.support_requests
      add constraint support_requests_category_key_fkey
      foreign key (category_key)
      references public.support_request_categories(key);
  end if;
end $$;

alter table public.support_requests
  drop constraint if exists support_requests_requester_profile_check,
  add constraint support_requests_requester_profile_check
    check (requester_profile in ('organization', 'trainer', 'both')),
  drop constraint if exists support_requests_priority_check,
  add constraint support_requests_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent'));

create index if not exists support_requests_category_key_idx
  on public.support_requests(category_key, created_at desc);

create index if not exists support_requests_requester_profile_idx
  on public.support_requests(requester_profile, created_at desc);

create index if not exists support_requests_priority_idx
  on public.support_requests(priority, status, created_at desc);

alter table public.support_request_categories enable row level security;

drop policy if exists "support_request_categories_read" on public.support_request_categories;
create policy "support_request_categories_read"
on public.support_request_categories for select
to authenticated
using (is_active = true);

grant select on public.support_request_categories to authenticated;

create or replace function public.create_support_request(
  p_audience text,
  p_organization_id uuid,
  p_category text,
  p_message text,
  p_app_version text default null
)
returns table (
  id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_first_name text;
  v_last_name text;
  v_organization_id uuid;
  v_trainer_id uuid;
  v_request_id uuid;
  v_created_at timestamptz;
  v_category_key text := lower(btrim(coalesce(p_category, '')));
  v_category_label text;
  v_has_organization boolean := false;
  v_has_trainer boolean := false;
  v_requester_profile text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_audience not in ('organization', 'trainer') then
    raise exception 'INVALID_AUDIENCE';
  end if;

  if btrim(coalesce(p_message, '')) = '' then
    raise exception 'MESSAGE_REQUIRED';
  end if;

  if char_length(btrim(p_message)) > 5000 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  select c.label
    into v_category_label
  from public.support_request_categories c
  where c.key = v_category_key
    and c.is_active = true;

  if v_category_label is null then
    raise exception 'INVALID_CATEGORY';
  end if;

  select lower(btrim(coalesce(u.email, ''))), p.first_name, p.last_name
    into v_email, v_first_name, v_last_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  if coalesce(v_email, '') = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  select exists (
    select 1
    from public.organization_members om
    where om.user_id = v_user_id
  ) into v_has_organization;

  select exists (
    select 1
    from public.trainers t
    where t.user_id = v_user_id
  ) into v_has_trainer;

  v_requester_profile := case
    when v_has_organization and v_has_trainer then 'both'
    when v_has_trainer then 'trainer'
    when v_has_organization then 'organization'
    else null
  end;

  if v_requester_profile is null then
    raise exception 'USER_PROFILE_REQUIRED';
  end if;

  if p_audience = 'organization' then
    if p_organization_id is null or not public.is_organization_member(p_organization_id) then
      raise exception 'ORGANIZATION_FORBIDDEN';
    end if;
    v_organization_id := p_organization_id;
  else
    select t.id
      into v_trainer_id
    from public.trainers t
    where t.user_id = v_user_id
    limit 1;

    if v_trainer_id is null then
      raise exception 'TRAINER_PROFILE_REQUIRED';
    end if;
  end if;

  insert into public.support_requests (
    requester_user_id,
    requester_email,
    requester_first_name,
    requester_last_name,
    requester_profile,
    audience,
    organization_id,
    trainer_id,
    category_key,
    category,
    message,
    app_version
  ) values (
    v_user_id,
    v_email,
    nullif(btrim(coalesce(v_first_name, '')), ''),
    nullif(btrim(coalesce(v_last_name, '')), ''),
    v_requester_profile,
    p_audience,
    v_organization_id,
    v_trainer_id,
    v_category_key,
    v_category_label,
    btrim(p_message),
    nullif(left(btrim(coalesce(p_app_version, '')), 40), '')
  )
  returning support_requests.id, support_requests.created_at
    into v_request_id, v_created_at;

  return query select v_request_id, v_created_at;
end;
$$;

revoke all on function public.create_support_request(text, uuid, text, text, text) from public;
grant execute on function public.create_support_request(text, uuid, text, text, text) to authenticated;
