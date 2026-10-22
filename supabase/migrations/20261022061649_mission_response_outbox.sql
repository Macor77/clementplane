-- Durable response notifications. No historical backfill: only new responses.
create schema if not exists notification_private;
revoke all on schema notification_private from public,anon,authenticated;
create table public.mission_response_outbox (
 id uuid primary key default gen_random_uuid(),
 relation_id uuid not null references public.mission_formateurs(id) on delete cascade,
 response text not null check(response in ('accepte','refuse')),
 responded_at timestamptz not null,
 response_comment text,
 status text not null default 'pending' check(status in ('pending','processing','sending','sent','failed','uncertain')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 lock_id uuid, locked_at timestamptz,
 last_error text, created_at timestamptz not null default now(),finished_at timestamptz,
 unique(relation_id,response,responded_at)
);
alter table public.mission_response_outbox enable row level security;
revoke all on public.mission_response_outbox from public,anon,authenticated;
grant select,insert,update,delete on public.mission_response_outbox to service_role;
create index mission_response_outbox_due on public.mission_response_outbox(next_attempt_at) where status='pending';
create or replace function notification_private.enqueue_response() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.statut in ('accepte','refuse') and new.repondu_le is not null
 and (old.statut is distinct from new.statut or old.repondu_le is distinct from new.repondu_le) then
  insert into public.mission_response_outbox(relation_id,response,responded_at,response_comment)
  values(new.id,new.statut,new.repondu_le,new.response_comment) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function notification_private.enqueue_response() from public,anon,authenticated;
create trigger enqueue_mission_response after update on public.mission_formateurs
 for each row execute function notification_private.enqueue_response();

-- These worker-only invoker RPCs are not available to browser roles.
create function public.claim_mission_response() returns setof public.mission_response_outbox
language plpgsql security invoker set search_path='' as $$
begin
 -- Provider webhook evidence can reconcile a lost HTTP response without resending.
 update public.mission_response_outbox q set status='sent',finished_at=now(),response_comment=null,lock_id=null,locked_at=null,last_error=null
 from public.email_logs e where e.id=q.id and q.status in ('sending','uncertain')
 and (e.sent_at is not null or e.delivered_at is not null or e.provider_message_id is not null);
 -- A crashed worker may have submitted the mail. Never blindly resend it.
 update public.mission_response_outbox set status='uncertain',last_error='Worker stopped during provider request',finished_at=now()
 where status='sending' and locked_at < now()-interval '5 minutes';
 update public.mission_response_outbox set status=case when attempts>=6 then 'failed' else 'pending' end,
 lock_id=null,locked_at=null,last_error='Preparation worker lease expired'
 where status='processing' and locked_at < now()-interval '5 minutes';
 delete from public.mission_response_outbox where created_at < now()-interval '30 days' and status in ('sent','failed','uncertain');
 return query
 update public.mission_response_outbox q set status='processing',attempts=q.attempts+1,lock_id=gen_random_uuid(),locked_at=now()
 where q.id=(select j.id from public.mission_response_outbox j where j.status='pending' and j.next_attempt_at<=now() order by j.next_attempt_at,j.id for update skip locked limit 1)
 returning q.*;
end $$;
create function public.start_mission_response_send(p_id uuid,p_lock uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 update public.mission_response_outbox set status='sending',locked_at=now()
 where id=p_id and lock_id=p_lock and status='processing' and locked_at>now()-interval '5 minutes';
 return found;
end $$;
create function public.finish_mission_response(p_id uuid,p_lock uuid,p_status text,p_error text default null,p_delay integer default 60) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if p_status not in ('pending','sent','failed','uncertain') then raise exception 'INVALID_STATUS';end if;
 update public.mission_response_outbox set
 status=case when p_status='pending' and attempts>=6 then 'failed' else p_status end,
 next_attempt_at=now()+make_interval(secs=>greatest(60,least(86400,p_delay))),
 last_error=left(p_error,500),lock_id=null,locked_at=null,
 finished_at=case when p_status='pending' and attempts<6 then null else now() end,
 response_comment=case when p_status='sent' then null else response_comment end
 where id=p_id and lock_id=p_lock and status in ('processing','sending','uncertain');
 return found;
end $$;
revoke all on function public.claim_mission_response(),public.start_mission_response_send(uuid,uuid),public.finish_mission_response(uuid,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.claim_mission_response(),public.start_mission_response_send(uuid,uuid),public.finish_mission_response(uuid,uuid,text,text,integer) to service_role;
