-- ============================================================
-- TimeForma
-- Inscription publique d'un organisme
--
-- Lorsqu'un auth.users est créé avec :
-- signup_intent = 'organization'
-- organization_name = '...'
--
-- la base crée automatiquement :
-- - profiles
-- - organizations
-- - organization_members avec rôle owner
-- ============================================================


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signup_intent text;
  v_organization_name text;
  v_slug_base text;
  v_slug text;
  v_organization_id uuid;
begin

  insert into public.profiles (
    id,
    first_name,
    last_name
  )
  values (
    new.id,
    nullif(
      new.raw_user_meta_data ->> 'first_name',
      ''
    ),
    nullif(
      new.raw_user_meta_data ->> 'last_name',
      ''
    )
  )
  on conflict (id)
  do update set
    first_name = coalesce(
      excluded.first_name,
      public.profiles.first_name
    ),
    last_name = coalesce(
      excluded.last_name,
      public.profiles.last_name
    );


  v_signup_intent :=
    nullif(
      new.raw_user_meta_data ->> 'signup_intent',
      ''
    );


  if v_signup_intent = 'organization' then

    v_organization_name :=
      nullif(
        btrim(
          new.raw_user_meta_data ->> 'organization_name'
        ),
        ''
      );


    if v_organization_name is null then
      raise exception 'ORGANIZATION_NAME_REQUIRED';
    end if;


    v_slug_base :=
      trim(
        both '-'
        from regexp_replace(
          lower(v_organization_name),
          '[^a-z0-9]+',
          '-',
          'g'
        )
      );


    if v_slug_base is null
       or v_slug_base = '' then
      v_slug_base := 'organisme';
    end if;


    /*
     * L'identifiant utilisateur garantit l'unicité
     * même si deux organismes portent le même nom.
     */
    v_slug :=
      v_slug_base
      || '-'
      || substring(
        replace(
          new.id::text,
          '-',
          ''
        )
        from 1
        for 8
      );


    insert into public.organizations (
      name,
      legal_name,
      slug,
      status
    )
    values (
      v_organization_name,
      v_organization_name,
      v_slug,
      'active'
    )
    returning id
    into v_organization_id;


    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at
    )
    values (
      v_organization_id,
      new.id,
      'owner',
      'active',
      now()
    )
    on conflict (
      organization_id,
      user_id
    )
    do nothing;

  end if;


  return new;
end;
$$;
