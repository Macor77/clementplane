-- Private optional monthly target. No change to reports, expenses or calendars.
begin;
create table public.trainer_activity_goals (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  month date not null check (month >= date '2000-01-01' and month < date '2100-01-01' and extract(day from month) = 1),
  metric text not null check (metric in ('sessions','days','revenue_ht','revenue_ttc')),
  target numeric not null check (target > 0 and target <= 99999999.99 and target = round(target, 2) and (metric <> 'sessions' or target = trunc(target))),
  primary key (owner_user_id, month)
);
alter table public.trainer_activity_goals enable row level security;
revoke all on public.trainer_activity_goals from public, anon, authenticated;
grant select, insert, update, delete on public.trainer_activity_goals to authenticated;
create policy trainer_goal_read on public.trainer_activity_goals for select to authenticated
  using (owner_user_id = (select auth.uid()) and (select public.current_trainer_profile_id()) is not null);
create policy trainer_goal_insert on public.trainer_activity_goals for insert to authenticated
  with check (owner_user_id = (select auth.uid()) and (select public.current_trainer_profile_id()) is not null);
create policy trainer_goal_update on public.trainer_activity_goals for update to authenticated
  using (owner_user_id = (select auth.uid()) and (select public.current_trainer_profile_id()) is not null)
  with check (owner_user_id = (select auth.uid()) and (select public.current_trainer_profile_id()) is not null);
create policy trainer_goal_delete on public.trainer_activity_goals for delete to authenticated
  using (owner_user_id = (select auth.uid()) and (select public.current_trainer_profile_id()) is not null);
comment on table public.trainer_activity_goals is 'Optional owner-only trainer goals; never shared with organizations or calendars.';
commit;
