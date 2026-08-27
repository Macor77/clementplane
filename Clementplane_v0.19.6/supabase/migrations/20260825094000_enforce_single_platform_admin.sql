-- Sprint 17 security hardening
-- Formaplane currently has a single intended platform administrator:
-- vincent.macor@alter-prevention.com
--
-- This migration removes any other existing platform-admin assignment and
-- guarantees the intended account is present if it exists in Supabase Auth.

delete from public.platform_admins pa
using auth.users u
where pa.user_id = u.id
  and lower(u.email) <> 'vincent.macor@alter-prevention.com';

insert into public.platform_admins (user_id)
select id
from auth.users
where lower(email) = 'vincent.macor@alter-prevention.com'
on conflict (user_id) do nothing;

-- Keep the table inaccessible from normal application clients.
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
