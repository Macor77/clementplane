-- Sprint 17.3 — Communications « Nouveautés Formaplane » + désabonnement dédié
create table if not exists public.feature_news_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscribed boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.feature_news_preferences(user_id)
select id from public.profiles on conflict (user_id) do nothing;
alter table public.feature_news_preferences enable row level security;
revoke all on public.feature_news_preferences from anon, authenticated;

create table if not exists public.feature_announcements (
  id uuid primary key default gen_random_uuid(),
  subject text not null, message text not null, audiences text[] not null,
  eligible_count integer not null default 0, sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), sent_at timestamptz
);
alter table public.feature_announcements enable row level security;
revoke all on public.feature_announcements from anon, authenticated;

create or replace function public.admin_feature_news_recipients(p_audiences text[])
returns table(user_id uuid,email text,first_name text,has_organization boolean,has_trainer boolean,unsubscribe_token uuid)
language plpgsql security definer set search_path=public,auth as $$
begin
 if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 return query
 with b as (
  select u.id user_id,u.email::text email,p.first_name,
   exists(select 1 from public.organization_members om where om.user_id=u.id and om.status='active') has_org,
   exists(select 1 from public.trainers t where t.user_id=u.id) has_trainer,
   pref.unsubscribe_token,pref.subscribed
  from auth.users u join public.profiles p on p.id=u.id
  join public.feature_news_preferences pref on pref.user_id=u.id
  where p.account_status='active' and u.email is not null
 )
 select b.user_id,b.email,b.first_name,b.has_org,b.has_trainer,b.unsubscribe_token from b
 where b.subscribed and (
  ('organization'=any(p_audiences) and b.has_org) or
  ('trainer'=any(p_audiences) and b.has_trainer) or
  ('both'=any(p_audiences) and b.has_org and b.has_trainer)
 );
end $$;
grant execute on function public.admin_feature_news_recipients(text[]) to authenticated;

create or replace function public.admin_feature_news_preview(p_audiences text[])
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_eligible int; v_unsub int;
begin
 if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 select count(*) into v_eligible from public.admin_feature_news_recipients(p_audiences);
 select count(*) into v_unsub from public.feature_news_preferences where not subscribed;
 return jsonb_build_object('eligible',v_eligible,'unsubscribed_total',v_unsub);
end $$;
grant execute on function public.admin_feature_news_preview(text[]) to authenticated;

create or replace function public.unsubscribe_feature_news(p_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update public.feature_news_preferences set subscribed=false,unsubscribed_at=now(),updated_at=now()
 where unsubscribe_token=p_token;
 return found;
end $$;
grant execute on function public.unsubscribe_feature_news(uuid) to anon,authenticated;

create or replace function public.admin_feature_news_history()
returns setof public.feature_announcements language plpgsql security definer set search_path=public as $$
begin
 if not public.is_platform_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 return query select * from public.feature_announcements order by created_at desc limit 50;
end $$;
grant execute on function public.admin_feature_news_history() to authenticated;
