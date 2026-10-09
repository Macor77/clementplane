-- Additive only. Do not replay/relabel previous production migrations.
create table public.calendar_connections (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 provider text not null default 'google' check(provider='google'),
 status text not null default 'disconnected' check(status in ('disconnected','active','reconnect','error')),
 google_sub text, account_email text, calendar_id text,
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
create unique index calendar_google_owner on public.calendar_connections(google_sub) where google_sub is not null;
create index calendar_due on public.calendar_connections(due_at) where status='active';
create table public.calendar_oauth_states (
 state_hash text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 verifier_ciphertext text not null, expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index calendar_oauth_expiration on public.calendar_oauth_states(expires_at);
create table public.calendar_events (
 connection_id uuid not null references public.calendar_connections(id) on delete cascade,
 key text not null, event_id text not null, generation integer not null default 0,
 checked_cycle uuid, deleted boolean not null default false,
 primary key(connection_id,key),unique(connection_id,event_id)
);
-- OAuth and provider tokens are never readable through the user/anonymous Data API.
alter table public.calendar_connections enable row level security;
alter table public.calendar_oauth_states enable row level security;
alter table public.calendar_events enable row level security;
revoke all on public.calendar_connections,public.calendar_oauth_states,public.calendar_events from public,anon,authenticated;
grant select,insert,update,delete on public.calendar_connections,public.calendar_oauth_states,public.calendar_events to service_role;

create or replace function public.calendar_claim()
returns setof public.calendar_connections language plpgsql security invoker set search_path='' as $$
declare selected uuid;
begin
 select c.id into selected from public.calendar_connections c
 where c.status='active' and c.token_ciphertext is not null and c.due_at<=now()
 and (c.lock_until is null or c.lock_until<now())
 order by c.due_at for update skip locked limit 1;
 if selected is null then return; end if;
 return query update public.calendar_connections c
 set lock_id=gen_random_uuid(),lock_until=now()+interval '5 minutes',cycle_id=coalesce(c.cycle_id,gen_random_uuid())
 where c.id=selected returning c.*;
end $$;
create or replace function public.calendar_lock(p_user_id uuid)
returns setof public.calendar_connections language sql security invoker set search_path='' as $$
 update public.calendar_connections c set lock_id=gen_random_uuid(),lock_until=now()+interval '5 minutes'
 where c.user_id=p_user_id and (c.lock_until is null or c.lock_until<now()) returning c.*;
$$;
create or replace function public.calendar_finish(p_id uuid,p_lock uuid,p_version bigint,p_status text,p_error text,p_delay integer)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.calendar_connections c set
 status=p_status,error_code=p_error,
 attempts=case when p_error is null then 0 when p_error='continuing' then c.attempts else c.attempts+1 end,
 synced_version=case when p_error is null then p_version else c.synced_version end,
 last_success_at=case when p_error is null and c.dirty_version=p_version then now() else c.last_success_at end,
 due_at=case when c.dirty_version<>p_version then now() else now()+make_interval(secs=>greatest(1,least(86400,p_delay))) end,
 cycle_id=case when p_error is null then null else c.cycle_id end,lock_id=null,lock_until=null
 where c.id=p_id and c.lock_id=p_lock and c.lock_until>now();
 return found;
end $$;

-- Use exactly the trainer's established read APIs. This identity switch is service-only,
-- transaction-local, and restored before returning; it is NOT an end-user RPC.
create or replace function public.calendar_source_snapshot(p_user_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved_sub text; saved_claims text; result jsonb; org_rows jsonb; personal_rows jsonb;
begin
 saved_sub:=current_setting('request.jwt.claim.sub',true);
 saved_claims:=current_setting('request.jwt.claims',true);
 perform set_config('request.jwt.claim.sub',p_user_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p_user_id,'role','authenticated')::text,true);
 select coalesce(jsonb_agg(
  (to_jsonb(p)-'response_comment'-'withdrawal_comment') || jsonb_build_object(
   'origin','organization','mission_status',m.statut,'address',m.adresse,
   'pending_change',(select to_jsonb(ch) from public.get_my_pending_mission_change(p.mission_id) ch limit 1),
   'contact_name',contact.contact_name,'contact_email',contact.contact_email,'contact_phone',contact.contact_phone)
 ),'[]'::jsonb) into org_rows
 from public.get_my_mission_proposals() p
 join public.missions m on m.id=p.mission_id
 left join lateral public.get_my_mission_organization_contact(p.mission_id) contact on true;
 select coalesce(jsonb_agg(jsonb_build_object(
  'origin','personal','mission_id',p.id,'status',p.status,'formation',p.formation,
  'title',p.title,'client_name',p.client_name,'location',p.location,
  'site_name',p.site_name,'address',p.address,'postal_code',p.postal_code,'city',p.city,
  'dates',p.dates,'private_notes',p.private_notes,'fee',p.fee,'fee_unit',p.fee_unit
 )),'[]'::jsonb) into personal_rows
 from public.trainer_personal_missions p join public.trainers t on t.id=p.trainer_id
 where p.owner_user_id=p_user_id and t.user_id=p_user_id;
 result:=org_rows||personal_rows;
 perform set_config('request.jwt.claim.sub',coalesce(saved_sub,''),true);
 perform set_config('request.jwt.claims',coalesce(saved_claims,''),true);
 return result;
end $$;
revoke all on function public.calendar_claim(),public.calendar_lock(uuid),public.calendar_finish(uuid,uuid,bigint,text,text,integer),public.calendar_source_snapshot(uuid) from public,anon,authenticated;
grant execute on function public.calendar_claim(),public.calendar_lock(uuid),public.calendar_finish(uuid,uuid,bigint,text,text,integer),public.calendar_source_snapshot(uuid) to service_role;

create schema if not exists calendar_private;
revoke all on schema calendar_private from public,anon,authenticated;
-- Definer is required ONLY to enqueue from ordinary business writers. No HTTP,
-- no token access, no callable user endpoint. The enclosing transaction remains atomic.
create function calendar_private.enqueue_user(p_user_id uuid) returns void
language sql security definer set search_path='' as $$
 update public.calendar_connections set dirty_version=dirty_version+1,cycle_id=null,due_at=now()
 where user_id=p_user_id and status='active';
$$;
create function calendar_private.enqueue_mission(p_mission_id uuid) returns void
language sql security definer set search_path='' as $$
 update public.calendar_connections c set dirty_version=dirty_version+1,cycle_id=null,due_at=now()
 where c.status='active' and c.user_id in (
 select t.user_id from public.mission_formateurs mf join public.trainers t on t.id=mf.formateur_id where mf.mission_id=p_mission_id);
$$;
create function calendar_private.business_changed() returns trigger
language plpgsql security definer set search_path='' as $$
declare old_row jsonb;new_row jsonb; r jsonb;
begin
 if tg_op<>'INSERT' then old_row:=to_jsonb(old);end if;
 if tg_op<>'DELETE' then new_row:=to_jsonb(new);end if;
 for r in select value from jsonb_array_elements(jsonb_build_array(old_row,new_row)) where value<>'null'::jsonb loop
  if tg_table_name='trainer_personal_missions' then
   perform calendar_private.enqueue_user((r->>'owner_user_id')::uuid);
  elsif tg_table_name in ('mission_formateurs','mission_change_request_trainers') then
   perform calendar_private.enqueue_user((select user_id from public.trainers where id=coalesce((r->>'formateur_id')::uuid,(r->>'trainer_id')::uuid)));
   if tg_table_name='mission_formateurs' then perform calendar_private.enqueue_mission((r->>'mission_id')::uuid);end if;
  elsif tg_table_name='missions' then perform calendar_private.enqueue_mission((r->>'id')::uuid);
  else perform calendar_private.enqueue_mission((r->>'mission_id')::uuid);
  end if;
 end loop;
 return coalesce(new,old);
end $$;
revoke all on all functions in schema calendar_private from public,anon,authenticated;
create trigger calendar_personal_changed after insert or update or delete on public.trainer_personal_missions for each row execute function calendar_private.business_changed();
create trigger calendar_mission_changed after insert or update or delete on public.missions for each row execute function calendar_private.business_changed();
create trigger calendar_dates_changed after insert or update or delete on public.mission_dates for each row execute function calendar_private.business_changed();
create trigger calendar_relation_changed after insert or update or delete on public.mission_formateurs for each row execute function calendar_private.business_changed();
create trigger calendar_change_changed after insert or update or delete on public.mission_change_requests for each row execute function calendar_private.business_changed();
create trigger calendar_change_trainer_changed after insert or update or delete on public.mission_change_request_trainers for each row execute function calendar_private.business_changed();
