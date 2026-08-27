-- ==========================================================
-- SPRINT 10.2 — CORRECTION AJOUT COMPÉTENCE AU RÉFÉRENTIEL
-- ==========================================================
--
-- Corrige l'ambiguïté SQL de add_competency_to_catalog :
-- les noms id / name / normalized_name entraient en conflit
-- avec les colonnes retournées par la fonction.
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

  return query
  insert into public.competency_catalog as cc (
    name,
    normalized_name,
    created_by_user_id
  )
  values (
    cleaned_name,
    normalized,
    current_user_id
  )
  on conflict (normalized_name)
  do update
  set
    is_active = true
  returning
    cc.id,
    cc.name,
    cc.normalized_name;
end;
$$;

revoke all
on function public.add_competency_to_catalog(text)
from public;

grant execute
on function public.add_competency_to_catalog(text)
to authenticated;
