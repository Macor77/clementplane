-- ==========================================================
-- SPRINT 10.2 — CORRECTION 2 AJOUT COMPÉTENCE AU RÉFÉRENTIEL
-- ==========================================================
--
-- Supprime définitivement l'ambiguïté PL/pgSQL autour de
-- normalized_name en évitant ON CONFLICT (normalized_name).
-- ==========================================================

create or replace function public.add_competency_to_catalog(
  p_name text
)
returns table (
  id uuid,
  name text,
  normalized_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_name text :=
    regexp_replace(
      btrim(
        coalesce(
          p_name,
          ''
        )
      ),
      '\s+',
      ' ',
      'g'
    );
  normalized text;
  existing_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if cleaned_name = '' then
    raise exception 'COMPETENCY_NAME_REQUIRED';
  end if;

  normalized :=
    public.normalize_competency_name(
      cleaned_name
    );

  select cc.id
  into existing_id
  from public.competency_catalog cc
  where cc.normalized_name = normalized
  limit 1;

  if existing_id is not null then
    update public.competency_catalog cc
    set is_active = true
    where cc.id = existing_id;

    return query
    select
      cc.id,
      cc.name,
      cc.normalized_name
    from public.competency_catalog cc
    where cc.id = existing_id;

    return;
  end if;

  return query
  insert into public.competency_catalog (
    name,
    normalized_name,
    created_by_user_id
  )
  values (
    cleaned_name,
    normalized,
    current_user_id
  )
  returning
    competency_catalog.id,
    competency_catalog.name,
    competency_catalog.normalized_name;
end;
$$;

revoke all
on function public.add_competency_to_catalog(text)
from public;

grant execute
on function public.add_competency_to_catalog(text)
to authenticated;
