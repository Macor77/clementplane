-- ==========================================================
-- SPRINT 8.3
-- Refonte des notes de disponibilités
--
-- Objectifs :
-- - plusieurs notes par journée
-- - propriété claire de chaque note
-- - séparation Formateur / OF
-- - protection des notes du formateur
-- ==========================================================


create table if not exists public.trainer_availability_notes (
  id uuid primary key default gen_random_uuid(),

  trainer_id uuid not null
    references public.trainers(id)
    on delete cascade,

  day date not null,

  content text not null,

  source text not null
    check (
      source in (
        'trainer',
        'organization'
      )
    ),

  author_user_id uuid
    references auth.users(id)
    on delete set null,

  organization_id uuid
    references public.organizations(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint trainer_availability_notes_content_not_empty
    check (
      length(
        btrim(content)
      ) > 0
    ),

  constraint trainer_availability_notes_owner_check
    check (
      (
        source = 'trainer'
        and organization_id is null
      )
      or
      (
        source = 'organization'
        and organization_id is not null
      )
    )
);


create index if not exists
trainer_availability_notes_trainer_day_idx
on public.trainer_availability_notes (
  trainer_id,
  day
);


create index if not exists
trainer_availability_notes_organization_idx
on public.trainer_availability_notes (
  organization_id
);


alter table
public.trainer_availability_notes
enable row level security;


/*
 * Aucun accès direct depuis le client.
 *
 * Toutes les opérations passent par
 * des fonctions sécurisées.
 */
revoke all
on public.trainer_availability_notes
from anon,
authenticated;



-- ==========================================================
-- OUTILS DE CONTRÔLE ORGANISATION
-- ==========================================================

create or replace function public.user_belongs_to_organization(
  p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1

    from public.organization_members om

    where om.user_id = auth.uid()

      and om.organization_id =
        p_organization_id

      and om.status = 'active'
  );
$$;


revoke all
on function public.user_belongs_to_organization(uuid)
from public;

grant execute
on function public.user_belongs_to_organization(uuid)
to authenticated;



-- ==========================================================
-- FORMATEUR : LECTURE DE SES PROPRES NOTES
-- ==========================================================

create or replace function public.get_my_availability_notes(
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  day date,
  content text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    n.id,
    n.day,
    n.content,
    n.created_at,
    n.updated_at

  from public.trainer_availability_notes n

  join public.trainers t
    on t.id = n.trainer_id

  where t.user_id = auth.uid()

    and n.source = 'trainer'

    and n.day >= p_start_day
    and n.day <= p_end_day

  order by
    n.day,
    n.created_at;
$$;


revoke all
on function public.get_my_availability_notes(date, date)
from public;

grant execute
on function public.get_my_availability_notes(date, date)
to authenticated;



-- ==========================================================
-- FORMATEUR : CRÉATION
-- ==========================================================

create or replace function public.create_my_availability_note(
  p_day date,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_trainer_id uuid;
  new_note_id uuid;
begin

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;


  if p_day is null then
    raise exception 'DAY_REQUIRED';
  end if;


  if nullif(
    btrim(
      coalesce(
        p_content,
        ''
      )
    ),
    ''
  ) is null then
    raise exception 'NOTE_CONTENT_REQUIRED';
  end if;


  select t.id
  into current_trainer_id

  from public.trainers t

  where t.user_id = auth.uid()

  limit 1;


  if current_trainer_id is null then
    raise exception 'TRAINER_PROFILE_NOT_FOUND';
  end if;


  insert into public.trainer_availability_notes (
    trainer_id,
    day,
    content,
    source,
    author_user_id
  )
  values (
    current_trainer_id,
    p_day,
    btrim(p_content),
    'trainer',
    auth.uid()
  )
  returning id
  into new_note_id;


  return new_note_id;

end;
$$;


revoke all
on function public.create_my_availability_note(date, text)
from public;

grant execute
on function public.create_my_availability_note(date, text)
to authenticated;



-- ==========================================================
-- FORMATEUR : MODIFICATION
-- ==========================================================

create or replace function public.update_my_availability_note(
  p_note_id uuid,
  p_content text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin

  if nullif(
    btrim(
      coalesce(
        p_content,
        ''
      )
    ),
    ''
  ) is null then
    raise exception 'NOTE_CONTENT_REQUIRED';
  end if;


  update public.trainer_availability_notes n

  set
    content = btrim(p_content),
    updated_at = now()

  from public.trainers t

  where n.id = p_note_id

    and n.trainer_id = t.id

    and t.user_id = auth.uid()

    and n.source = 'trainer'

    and n.author_user_id = auth.uid();


  if not found then
    raise exception 'NOTE_NOT_FOUND_OR_FORBIDDEN';
  end if;


  return true;

end;
$$;


revoke all
on function public.update_my_availability_note(uuid, text)
from public;

grant execute
on function public.update_my_availability_note(uuid, text)
to authenticated;



-- ==========================================================
-- FORMATEUR : SUPPRESSION
-- ==========================================================

create or replace function public.delete_my_availability_note(
  p_note_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin

  delete from public.trainer_availability_notes n

  using public.trainers t

  where n.id = p_note_id

    and n.trainer_id = t.id

    and t.user_id = auth.uid()

    and n.source = 'trainer'

    and n.author_user_id = auth.uid();


  if not found then
    raise exception 'NOTE_NOT_FOUND_OR_FORBIDDEN';
  end if;


  return true;

end;
$$;


revoke all
on function public.delete_my_availability_note(uuid)
from public;

grant execute
on function public.delete_my_availability_note(uuid)
to authenticated;



-- ==========================================================
-- OF : LECTURE
--
-- Un OF voit :
-- - les notes du formateur
-- - ses propres notes internes
--
-- Jamais celles des autres OF.
-- ==========================================================

create or replace function public.get_organization_availability_notes(
  p_organization_id uuid,
  p_trainer_ids uuid[],
  p_start_day date,
  p_end_day date
)
returns table (
  id uuid,
  trainer_id uuid,
  day date,
  content text,
  source text,
  can_edit boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin

  if not public.user_belongs_to_organization(
    p_organization_id
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;


  return query

  select
    n.id,
    n.trainer_id,
    n.day,
    n.content,
    n.source,

    (
      n.source = 'organization'
      and
      n.organization_id =
        p_organization_id
    ) as can_edit,

    n.created_at,
    n.updated_at

  from public.trainer_availability_notes n

  where n.trainer_id =
    any(p_trainer_ids)

    and n.day >= p_start_day
    and n.day <= p_end_day

    and (
      n.source = 'trainer'

      or

      (
        n.source = 'organization'
        and n.organization_id =
          p_organization_id
      )
    )

  order by
    n.day,
    n.created_at;

end;
$$;


revoke all
on function public.get_organization_availability_notes(
  uuid,
  uuid[],
  date,
  date
)
from public;

grant execute
on function public.get_organization_availability_notes(
  uuid,
  uuid[],
  date,
  date
)
to authenticated;



-- ==========================================================
-- OF : CRÉATION D'UNE NOTE INTERNE
-- ==========================================================

create or replace function public.create_organization_availability_note(
  p_organization_id uuid,
  p_trainer_id uuid,
  p_day date,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_note_id uuid;
begin

  if not public.user_belongs_to_organization(
    p_organization_id
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;


  if nullif(
    btrim(
      coalesce(
        p_content,
        ''
      )
    ),
    ''
  ) is null then
    raise exception 'NOTE_CONTENT_REQUIRED';
  end if;


  insert into public.trainer_availability_notes (
    trainer_id,
    day,
    content,
    source,
    author_user_id,
    organization_id
  )
  values (
    p_trainer_id,
    p_day,
    btrim(p_content),
    'organization',
    auth.uid(),
    p_organization_id
  )
  returning id
  into new_note_id;


  return new_note_id;

end;
$$;


revoke all
on function public.create_organization_availability_note(
  uuid,
  uuid,
  date,
  text
)
from public;

grant execute
on function public.create_organization_availability_note(
  uuid,
  uuid,
  date,
  text
)
to authenticated;



-- ==========================================================
-- OF : MODIFICATION DE SA PROPRE NOTE
-- ==========================================================

create or replace function public.update_organization_availability_note(
  p_organization_id uuid,
  p_note_id uuid,
  p_content text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin

  if not public.user_belongs_to_organization(
    p_organization_id
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;


  if nullif(
    btrim(
      coalesce(
        p_content,
        ''
      )
    ),
    ''
  ) is null then
    raise exception 'NOTE_CONTENT_REQUIRED';
  end if;


  update public.trainer_availability_notes

  set
    content = btrim(p_content),
    updated_at = now()

  where id = p_note_id

    and source = 'organization'

    and organization_id =
      p_organization_id;


  if not found then
    raise exception 'NOTE_NOT_FOUND_OR_FORBIDDEN';
  end if;


  return true;

end;
$$;


revoke all
on function public.update_organization_availability_note(
  uuid,
  uuid,
  text
)
from public;

grant execute
on function public.update_organization_availability_note(
  uuid,
  uuid,
  text
)
to authenticated;



-- ==========================================================
-- OF : SUPPRESSION DE SA PROPRE NOTE
-- ==========================================================

create or replace function public.delete_organization_availability_note(
  p_organization_id uuid,
  p_note_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin

  if not public.user_belongs_to_organization(
    p_organization_id
  ) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;


  delete from public.trainer_availability_notes

  where id = p_note_id

    and source = 'organization'

    and organization_id =
      p_organization_id;


  if not found then
    raise exception 'NOTE_NOT_FOUND_OR_FORBIDDEN';
  end if;


  return true;

end;
$$;


revoke all
on function public.delete_organization_availability_note(
  uuid,
  uuid
)
from public;

grant execute
on function public.delete_organization_availability_note(
  uuid,
  uuid
)
to authenticated;