-- Formaplane — Sprint 11.9.1
-- Désistement possible depuis une option acceptée OU une mission affectée.

create or replace function public.withdraw_from_my_mission_option(
  p_mission_formateur_id uuid,
  p_availability_by_day jsonb,
  p_comment text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer_id uuid;
  v_mission_id uuid;
  v_status text;
  v_day record;
  v_day_status text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    mf.formateur_id,
    mf.mission_id,
    mf.statut
  into
    v_trainer_id,
    v_mission_id,
    v_status
  from public.mission_formateurs mf
  join public.trainers t
    on t.id = mf.formateur_id
  where mf.id = p_mission_formateur_id
    and t.user_id = auth.uid()
  for update of mf;

  if not found then
    raise exception 'OPTION_NOT_FOUND';
  end if;

  if v_status not in ('accepte', 'affecte') then
    raise exception 'WITHDRAWAL_NOT_ALLOWED';
  end if;

  perform set_config(
    'formaplane.actor_type',
    'trainer',
    true
  );

  update public.mission_formateurs
  set
    statut = 'desiste',
    affecte_le = null,
    withdrawal_comment =
      nullif(
        btrim(coalesce(p_comment, '')),
        ''
      )
  where id = p_mission_formateur_id;

  /*
   * Si le formateur était celui officiellement affecté,
   * la mission redevient à pourvoir.
   *
   * On respecte la logique existante : seuls les statuts
   * "affectee" sont automatiquement ramenés à "a_pourvoir".
   * Les statuts protégés comme "confirmee" ou "realisee"
   * ne sont pas réécrits ici.
   */
  if v_status = 'affecte' then
    update public.missions
    set statut = 'a_pourvoir'
    where id = v_mission_id
      and statut = 'affectee';
  end if;

  /*
   * Le formateur choisit explicitement son statut de disponibilité
   * pour chacune des dates au moment du désistement.
   */
  for v_day in
    select md.date
    from public.mission_dates md
    where md.mission_id = v_mission_id
    order by md.date
  loop
    v_day_status := coalesce(
      p_availability_by_day
        ->> v_day.date::text,
      ''
    );

    if v_day_status not in (
      '',
      'dispo',
      'indispo'
    ) then
      v_day_status := '';
    end if;

    insert into public.trainer_availability (
      trainer_id,
      day,
      status,
      updated_at
    )
    values (
      v_trainer_id,
      v_day.date,
      v_day_status,
      now()
    )
    on conflict (
      trainer_id,
      day
    )
    do update
    set
      status = excluded.status,
      updated_at = excluded.updated_at;
  end loop;

  /*
   * Une affectation libérée peut rendre de nouveau valables
   * des options précédemment bloquées par conflit.
   */
  perform public.reconcile_trainer_conflicts_safe(
    v_trainer_id
  );

  return true;
end;
$$;

revoke all
on function public.withdraw_from_my_mission_option(
  uuid,
  jsonb,
  text
)
from public;

grant execute
on function public.withdraw_from_my_mission_option(
  uuid,
  jsonb,
  text
)
to authenticated;


create or replace function public.withdraw_from_my_mission_option(
  p_mission_formateur_id uuid,
  p_availability_by_day jsonb
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.withdraw_from_my_mission_option(
    p_mission_formateur_id,
    p_availability_by_day,
    ''::text
  );
$$;

revoke all
on function public.withdraw_from_my_mission_option(
  uuid,
  jsonb
)
from public;

grant execute
on function public.withdraw_from_my_mission_option(
  uuid,
  jsonb
)
to authenticated;
