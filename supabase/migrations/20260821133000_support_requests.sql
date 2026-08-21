-- Sprint 15 — Contact Formaplane / socle mini-CRM

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  requester_first_name text,
  requester_last_name text,
  audience text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  trainer_id uuid references public.trainers(id) on delete set null,
  category text not null,
  message text not null,
  app_version text,
  status text not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_requests_audience_check check (audience in ('organization', 'trainer')),
  constraint support_requests_status_check check (status in ('new', 'in_progress', 'resolved', 'closed')),
  constraint support_requests_category_not_blank check (btrim(category) <> ''),
  constraint support_requests_message_not_blank check (btrim(message) <> ''),
  constraint support_requests_message_length check (char_length(message) <= 5000)
);

create index if not exists support_requests_requester_idx
  on public.support_requests(requester_user_id, created_at desc);
create index if not exists support_requests_status_idx
  on public.support_requests(status, created_at desc);
create index if not exists support_requests_organization_idx
  on public.support_requests(organization_id)
  where organization_id is not null;
create index if not exists support_requests_trainer_idx
  on public.support_requests(trainer_id)
  where trainer_id is not null;

drop trigger if exists support_requests_set_updated_at on public.support_requests;
create trigger support_requests_set_updated_at
before update on public.support_requests
for each row execute function public.set_updated_at();

alter table public.support_requests enable row level security;

-- Un utilisateur peut uniquement relire les demandes qu'il a lui-même envoyées.
drop policy if exists "support_requests_select_own" on public.support_requests;
create policy "support_requests_select_own"
on public.support_requests for select
to authenticated
using (requester_user_id = auth.uid());

-- Les créations passent exclusivement par la fonction ci-dessous afin que
-- l'identité, l'e-mail et les rattachements soient déterminés côté serveur.
revoke insert, update, delete on public.support_requests from authenticated;

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
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_audience not in ('organization', 'trainer') then
    raise exception 'INVALID_AUDIENCE';
  end if;

  if btrim(coalesce(p_category, '')) = '' then
    raise exception 'CATEGORY_REQUIRED';
  end if;

  if btrim(coalesce(p_message, '')) = '' then
    raise exception 'MESSAGE_REQUIRED';
  end if;

  if char_length(btrim(p_message)) > 5000 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  select lower(btrim(coalesce(u.email, ''))), p.first_name, p.last_name
    into v_email, v_first_name, v_last_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  if coalesce(v_email, '') = '' then
    raise exception 'EMAIL_REQUIRED';
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
    audience,
    organization_id,
    trainer_id,
    category,
    message,
    app_version
  ) values (
    v_user_id,
    v_email,
    nullif(btrim(coalesce(v_first_name, '')), ''),
    nullif(btrim(coalesce(v_last_name, '')), ''),
    p_audience,
    v_organization_id,
    v_trainer_id,
    left(btrim(p_category), 120),
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
