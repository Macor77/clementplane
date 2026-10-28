-- Additive only. Do not replay/relabel previous production migrations.
create table public.microsoft_calendar_connections (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 provider text not null default 'microsoft' check(provider='microsoft'),
 status text not null default 'disconnected' check(status in ('disconnected','active','reconnect','error')),
 microsoft_sub text, account_email text, calendar_id text,
 calendar_pending boolean not null default false,
 token_ciphertext text,
 include_fee boolean not null default false, include_notes boolean not null default false,
 first_day date not null default (now() at time zone 'Europe/Paris')::date,
 dirty_version bigint not null default 1, synced_version bigint not null default 0,
 due_at timestamptz not null default now(), last_success_at timestamptz,
 error_code text, attempts integer not null default 0,
 lock_id uuid, lock_until timestamptz, cycle_id uuid,
 created_at timestamptz not null default now()
);
create unique index microsoft_calendar_microsoft_owner on public.microsoft_calendar_connections(microsoft_sub) where microsoft_sub is not null;
create index microsoft_calendar_due on public.microsoft_calendar_connections(due_at) where status='active';
create table public.microsoft_calendar_oauth_states (
 state_hash text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 verifier_ciphertext text not null, expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index microsoft_calendar_oauth_expiration on public.microsoft_calendar_oauth_states(expires_at);
create table public.microsoft_calendar_events (
 connection_id uuid not null references public.microsoft_calendar_connections(id) on delete cascade,
 key text not null, event_id text, generation integer not null default 0,
 creation_pending boolean not null default false,
 checked_cycle uuid, deleted boolean not null default false,
 primary key(connection_id,key),unique(connection_id,event_id)
);
-- OAuth and provider tokens are never readable through the user/anonymous Data API.
alter table public.microsoft_calendar_connections enable row level security;
alter table public.microsoft_calendar_oauth_states enable row level security;
alter table public.microsoft_calendar_events enable row level security;
revoke all on public.microsoft_calendar_connections,public.microsoft_calendar_oauth_states,public.microsoft_calendar_events from public,anon,authenticated;
grant select,insert,update,delete on public.microsoft_calendar_connections,public.microsoft_calendar_oauth_states,public.microsoft_calendar_events to service_role;

create or replace function public.microsoft_calendar_claim(p_user_ids uuid[] default null)
returns setof public.microsoft_calendar_connections language plpgsql security invoker set search_path='' as $$
declare selected uuid;
begin
 select c.id into selected from public.microsoft_calendar_connections c
 where (p_user_ids is null or c.user_id=any(p_user_ids)) and c.status='active' and c.token_ciphertext is not null and c.due_at<=now()
 and (c.lock_until is null or c.lock_until<now())
 order by c.due_at for update skip locked limit 1;
 if selected is null then return; end if;
 return query update public.microsoft_calendar_connections c
 set lock_id=gen_random_uuid(),lock_until=now()+interval '5 minutes',cycle_id=coalesce(c.cycle_id,gen_random_uuid())
 where c.id=selected returning c.*;
end $$;
create or replace function public.microsoft_calendar_lock(p_user_id uuid)
returns setof public.microsoft_calendar_connections language sql security invoker set search_path='' as $$
 update public.microsoft_calendar_connections c set lock_id=gen_random_uuid(),lock_until=now()+interval '5 minutes'
 where c.user_id=p_user_id and (c.lock_until is null or c.lock_until<now()) returning c.*;
$$;
create or replace function public.microsoft_calendar_finish(p_id uuid,p_lock uuid,p_version bigint,p_status text,p_error text,p_delay integer)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.microsoft_calendar_connections c set
 status=p_status,error_code=p_error,
 attempts=case when p_error is null then 0 when p_error='continuing' then c.attempts else c.attempts+1 end,
 synced_version=case when p_error is null then p_version else c.synced_version end,
 last_success_at=case when p_error is null and c.dirty_version=p_version then now() else c.last_success_at end,
 due_at=case when c.dirty_version<>p_version then now() else now()+make_interval(secs=>greatest(1,least(86400,p_delay))) end,
 cycle_id=case when p_error is null then null else c.cycle_id end,lock_id=null,lock_until=null
 where c.id=p_id and c.lock_id=p_lock and c.lock_until>now();
 return found;
end $$;

revoke all on function public.microsoft_calendar_claim(uuid[]),public.microsoft_calendar_lock(uuid),public.microsoft_calendar_finish(uuid,uuid,bigint,text,text,integer) from public,anon,authenticated;
grant execute on function public.microsoft_calendar_claim(uuid[]),public.microsoft_calendar_lock(uuid),public.microsoft_calendar_finish(uuid,uuid,bigint,text,text,integer) to service_role;

create schema if not exists microsoft_calendar_private;
revoke all on schema microsoft_calendar_private from public,anon,authenticated;
-- Definer is required ONLY to enqueue from ordinary business writers. No HTTP,
-- no token access, no callable user endpoint. The enclosing transaction remains atomic.
create function microsoft_calendar_private.enqueue_user(p_user_id uuid) returns void
language sql security definer set search_path='' as $$
 update public.microsoft_calendar_connections set dirty_version=dirty_version+1,cycle_id=null,due_at=now()
 where user_id=p_user_id and status='active';
$$;
create function microsoft_calendar_private.enqueue_mission(p_mission_id uuid) returns void
language sql security definer set search_path='' as $$
 update public.microsoft_calendar_connections c set dirty_version=dirty_version+1,cycle_id=null,due_at=now()
 where c.status='active' and c.user_id in (
 select t.user_id from public.mission_formateurs mf join public.trainers t on t.id=mf.formateur_id where mf.mission_id=p_mission_id);
$$;
create function microsoft_calendar_private.business_changed() returns trigger
language plpgsql security definer set search_path='' as $$
declare old_row jsonb;new_row jsonb; r jsonb;
begin
 if tg_op<>'INSERT' then old_row:=to_jsonb(old);end if;
 if tg_op<>'DELETE' then new_row:=to_jsonb(new);end if;
 for r in select value from jsonb_array_elements(jsonb_build_array(old_row,new_row)) where value<>'null'::jsonb loop
  if tg_table_name='trainer_personal_missions' then
   perform microsoft_calendar_private.enqueue_user((r->>'owner_user_id')::uuid);
  elsif tg_table_name in ('mission_formateurs','mission_change_request_trainers') then
   perform microsoft_calendar_private.enqueue_user((select user_id from public.trainers where id=coalesce((r->>'formateur_id')::uuid,(r->>'trainer_id')::uuid)));
   if tg_table_name='mission_formateurs' then perform microsoft_calendar_private.enqueue_mission((r->>'mission_id')::uuid);end if;
  elsif tg_table_name='missions' then perform microsoft_calendar_private.enqueue_mission((r->>'id')::uuid);
  else perform microsoft_calendar_private.enqueue_mission((r->>'mission_id')::uuid);
  end if;
 end loop;
 return coalesce(new,old);
end $$;
revoke all on all functions in schema microsoft_calendar_private from public,anon,authenticated;
create trigger microsoft_calendar_personal_changed after insert or update or delete on public.trainer_personal_missions for each row execute function microsoft_calendar_private.business_changed();
create trigger microsoft_calendar_mission_changed after insert or update or delete on public.missions for each row execute function microsoft_calendar_private.business_changed();
create trigger microsoft_calendar_dates_changed after insert or update or delete on public.mission_dates for each row execute function microsoft_calendar_private.business_changed();
create trigger microsoft_calendar_relation_changed after insert or update or delete on public.mission_formateurs for each row execute function microsoft_calendar_private.business_changed();
create trigger microsoft_calendar_change_changed after insert or update or delete on public.mission_change_requests for each row execute function microsoft_calendar_private.business_changed();
create trigger microsoft_calendar_change_trainer_changed after insert or update or delete on public.mission_change_request_trainers for each row execute function microsoft_calendar_private.business_changed();
