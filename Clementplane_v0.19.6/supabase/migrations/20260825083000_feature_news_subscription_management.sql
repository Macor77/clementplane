-- Sprint 17.3 final polish — self-service subscription management with audit trail.

create table if not exists public.feature_news_preference_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('subscribed', 'unsubscribed')),
  source text not null default 'settings',
  created_at timestamptz not null default now()
);

alter table public.feature_news_preference_events enable row level security;
revoke all on public.feature_news_preference_events from anon, authenticated;

-- Keep an audit entry for the current state where possible.
insert into public.feature_news_preference_events(user_id, event_type, source, created_at)
select user_id, 'unsubscribed', 'email_link', unsubscribed_at
from public.feature_news_preferences p
where p.subscribed = false
  and p.unsubscribed_at is not null
  and not exists (
    select 1 from public.feature_news_preference_events e
    where e.user_id = p.user_id
      and e.event_type = 'unsubscribed'
      and e.created_at = p.unsubscribed_at
  );

create or replace function public.unsubscribe_feature_news(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid;
begin
  update public.feature_news_preferences
  set subscribed = false,
      unsubscribed_at = now(),
      updated_at = now()
  where unsubscribe_token = p_token
  returning user_id into v_user_id;

  if v_user_id is null then return false; end if;

  insert into public.feature_news_preference_events(user_id, event_type, source)
  values (v_user_id, 'unsubscribed', 'email_link');
  return true;
end;
$$;
grant execute on function public.unsubscribe_feature_news(uuid) to anon, authenticated;

create or replace function public.get_my_feature_news_preference()
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_pref public.feature_news_preferences%rowtype;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  insert into public.feature_news_preferences(user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_pref
  from public.feature_news_preferences
  where user_id = v_user_id;

  return jsonb_build_object(
    'subscribed', v_pref.subscribed,
    'unsubscribed_at', v_pref.unsubscribed_at,
    'updated_at', v_pref.updated_at
  );
end;
$$;
grant execute on function public.get_my_feature_news_preference() to authenticated;

create or replace function public.set_my_feature_news_subscription(p_subscribed boolean)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_before public.feature_news_preferences%rowtype;
  v_after public.feature_news_preferences%rowtype;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  insert into public.feature_news_preferences(user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_before
  from public.feature_news_preferences
  where user_id = v_user_id
  for update;

  if v_before.subscribed is distinct from p_subscribed then
    update public.feature_news_preferences
    set subscribed = p_subscribed,
        unsubscribed_at = case when p_subscribed then unsubscribed_at else now() end,
        updated_at = now()
    where user_id = v_user_id
    returning * into v_after;

    insert into public.feature_news_preference_events(user_id, event_type, source)
    values (v_user_id, case when p_subscribed then 'subscribed' else 'unsubscribed' end, 'settings');
  else
    v_after := v_before;
  end if;

  return jsonb_build_object(
    'subscribed', v_after.subscribed,
    'unsubscribed_at', v_after.unsubscribed_at,
    'updated_at', v_after.updated_at
  );
end;
$$;
grant execute on function public.set_my_feature_news_subscription(boolean) to authenticated;
