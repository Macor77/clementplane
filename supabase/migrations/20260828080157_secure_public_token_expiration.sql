-- Security hardening: public token links expire after 14 days.

-- 1. Public mission proposal:
-- keep the existing RPC but do not expose an expired proposal.
CREATE OR REPLACE FUNCTION public.get_public_mission_proposal(p_token uuid)
RETURNS TABLE(
  mission_formateur_id uuid,
  trainer_first_name text,
  trainer_last_name text,
  mission_title text,
  formation text,
  client text,
  location text,
  postal_code text,
  city text,
  offered_fee numeric,
  mission_notes text,
  dates jsonb,
  status text,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  response_comment text,
  organization_id uuid,
  organization_name text,
  organization_legal_name text,
  organization_contact_name text,
  organization_contact_email text,
  organization_contact_phone text,
  trainer_has_account boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_mf public.mission_formateurs%rowtype;
  v_org_name text;
BEGIN
  SELECT *
  INTO v_mf
  FROM public.mission_formateurs
  WHERE proposal_token = p_token;

  IF v_mf.id IS NULL THEN
    RETURN;
  END IF;

  IF v_mf.proposal_expires_at IS NULL
     OR v_mf.proposal_expires_at <= now()
  THEN
    RETURN;
  END IF;

  IF v_mf.proposal_viewed_at IS NULL THEN
    UPDATE public.mission_formateurs
    SET proposal_viewed_at = now()
    WHERE id = v_mf.id
      AND proposal_viewed_at IS NULL;

    IF FOUND THEN
      SELECT coalesce(o.name, o.legal_name)
      INTO v_org_name
      FROM public.missions m
      JOIN public.organizations o
        ON o.id = m.organization_id
      WHERE m.id = v_mf.mission_id;

      INSERT INTO public.mission_trainer_history (
        mission_id,
        trainer_id,
        mission_formateur_id,
        action,
        previous_status,
        new_status,
        actor_type,
        actor_display_name,
        actor_organization_name,
        details
      )
      VALUES (
        v_mf.mission_id,
        v_mf.formateur_id,
        v_mf.id,
        'proposal_viewed',
        v_mf.statut,
        v_mf.statut,
        'trainer',
        'Formateur',
        v_org_name,
        jsonb_build_object('source', 'public_proposal_link')
      );
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    mf.id,
    t.prenom,
    t.nom,
    coalesce(m.intitule, m.formation, 'Mission de formation'),
    m.formation,
    m.client,
    m.lieu,
    m.code_postal,
    m.ville,
    m.cout_formateur,
    m.commentaire,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'date', md.date,
          'heure_debut', md.heure_debut,
          'heure_fin', md.heure_fin
        )
        ORDER BY md.date, md.heure_debut
      ) FILTER (WHERE md.id IS NOT NULL),
      '[]'::jsonb
    ),
    mf.statut,
    mf.propose_le,
    mf.proposal_viewed_at,
    mf.repondu_le,
    mf.proposal_expires_at,
    mf.response_comment,
    o.id,
    coalesce(o.name, o.legal_name),
    o.legal_name,
    nullif(
      btrim(
        concat_ws(
          ' ',
          contact_profile.first_name,
          contact_profile.last_name
        )
      ),
      ''
    ),
    contact_user.email::text,
    contact_profile.phone,
    (t.user_id IS NOT NULL)
  FROM public.mission_formateurs mf
  JOIN public.missions m
    ON m.id = mf.mission_id
  JOIN public.trainers t
    ON t.id = mf.formateur_id
  JOIN public.organizations o
    ON o.id = m.organization_id
  LEFT JOIN public.mission_dates md
    ON md.mission_id = m.id
  LEFT JOIN LATERAL (
    SELECT om.user_id
    FROM public.organization_members om
    WHERE om.organization_id = o.id
      AND om.status = 'active'
    ORDER BY
      CASE om.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'manager' THEN 3
        ELSE 4
      END,
      om.joined_at NULLS LAST,
      om.created_at
    LIMIT 1
  ) contact_member ON true
  LEFT JOIN public.profiles contact_profile
    ON contact_profile.id = contact_member.user_id
  LEFT JOIN auth.users contact_user
    ON contact_user.id = contact_member.user_id
  WHERE mf.proposal_token = p_token
    AND mf.proposal_expires_at > now()
  GROUP BY
    mf.id,
    t.id,
    m.id,
    o.id,
    contact_profile.id,
    contact_user.id;
END;
$function$;


-- 2. Public mission-change reader:
-- public links are valid for 14 days from creation.
CREATE OR REPLACE FUNCTION public.get_public_mission_change(p_token uuid)
RETURNS TABLE(
  request_id uuid,
  request_status text,
  response_status text,
  response_comment text,
  previous_status text,
  relation_status text,
  trainer_first_name text,
  trainer_has_account boolean,
  mission_id uuid,
  mission_title text,
  organization_name text,
  previous_mission jsonb,
  proposed_mission jsonb,
  previous_dates jsonb,
  proposed_dates jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    r.id,
    r.status,
    rt.response_status,
    rt.response_comment,
    rt.previous_status,
    mf.statut,
    t.prenom,
    (t.user_id IS NOT NULL),
    m.id,
    coalesce(
      nullif(m.intitule, ''),
      nullif(m.formation, ''),
      'Mission de formation'
    ),
    coalesce(
      o.name,
      o.legal_name,
      'Organisme de formation'
    ),
    r.previous_mission,
    r.proposed_mission,
    r.previous_dates,
    r.proposed_dates
  FROM public.mission_change_request_trainers rt
  JOIN public.mission_change_requests r
    ON r.id = rt.change_request_id
  JOIN public.mission_formateurs mf
    ON mf.id = rt.mission_formateur_id
  JOIN public.trainers t
    ON t.id = rt.trainer_id
  JOIN public.missions m
    ON m.id = r.mission_id
  JOIN public.organizations o
    ON o.id = r.organization_id
  WHERE rt.public_response_token = p_token
    AND rt.public_link_created_at IS NOT NULL
    AND rt.public_link_created_at + interval '14 days' > now()
  LIMIT 1;
$function$;


-- 3. Public mission-change response:
-- reject expired links before any mutation.
CREATE OR REPLACE FUNCTION public.respond_to_public_mission_change(
  p_token uuid,
  p_response text,
  p_comment text DEFAULT ''::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target public.mission_change_request_trainers%rowtype;
  v_request public.mission_change_requests%rowtype;
  v_relation_status text;
  v_pending_count integer;
  v_trainer_name text;
  v_conflict_row record;
  v_has_conflict boolean;
  v_expected_status text;
BEGIN
  IF p_response NOT IN ('accepted', 'refused') THEN
    RAISE EXCEPTION 'INVALID_RESPONSE';
  END IF;

  SELECT *
  INTO v_target
  FROM public.mission_change_request_trainers rt
  WHERE rt.public_response_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHANGE_NOT_FOUND';
  END IF;

  IF v_target.public_link_created_at IS NULL
     OR v_target.public_link_created_at + interval '14 days' <= now()
  THEN
    RAISE EXCEPTION 'CHANGE_LINK_EXPIRED';
  END IF;

  SELECT *
  INTO v_request
  FROM public.mission_change_requests r
  WHERE r.id = v_target.change_request_id
  FOR UPDATE;

  SELECT mf.statut
  INTO v_relation_status
  FROM public.mission_formateurs mf
  WHERE mf.id = v_target.mission_formateur_id;

  IF v_target.response_status = 'unavailable'
     OR v_relation_status = 'mission_pourvue'
  THEN
    RAISE EXCEPTION 'MISSION_NO_LONGER_AVAILABLE';
  END IF;

  IF v_request.status <> 'pending'
     OR v_target.response_status <> 'pending'
  THEN
    RAISE EXCEPTION 'CHANGE_ALREADY_RESPONDED';
  END IF;

  UPDATE public.mission_change_request_trainers
  SET
    response_status = p_response,
    response_comment =
      nullif(btrim(coalesce(p_comment, '')), ''),
    responded_at = now()
  WHERE id = v_target.id;

  SELECT nullif(
    btrim(concat_ws(' ', t.prenom, t.nom)),
    ''
  )
  INTO v_trainer_name
  FROM public.trainers t
  WHERE t.id = v_target.trainer_id;

  INSERT INTO public.mission_trainer_history (
    mission_id,
    trainer_id,
    mission_formateur_id,
    action,
    previous_status,
    new_status,
    actor_type,
    actor_display_name,
    details
  )
  VALUES (
    v_request.mission_id,
    v_target.trainer_id,
    v_target.mission_formateur_id,
    CASE
      WHEN p_response = 'accepted'
        THEN 'change_accepted'
      ELSE 'change_refused'
    END,
    v_target.previous_status,
    v_target.previous_status,
    'trainer',
    coalesce(v_trainer_name, 'Formateur'),
    jsonb_build_object(
      'change_request_id', v_request.id,
      'comment',
        nullif(btrim(coalesce(p_comment, '')), ''),
      'source', 'public_revalidation_link'
    )
  );

  IF p_response = 'refused' THEN
    PERFORM set_config(
      'formaplane.actor_type',
      'trainer',
      true
    );

    UPDATE public.mission_formateurs
    SET
      statut = 'refuse',
      repondu_le = now(),
      response_comment =
        nullif(btrim(coalesce(p_comment, '')), ''),
      affecte_le = null
    WHERE id = v_target.mission_formateur_id;
  END IF;

  SELECT count(*)
  INTO v_pending_count
  FROM public.mission_change_request_trainers rt
  WHERE rt.change_request_id = v_request.id
    AND rt.response_status = 'pending';

  IF v_pending_count = 0 THEN
    UPDATE public.mission_change_requests
    SET
      status = 'applied',
      resolved_at = now()
    WHERE id = v_request.id;
  END IF;

  FOR v_conflict_row IN
    SELECT
      mf.id,
      mf.mission_id,
      mf.statut
    FROM public.mission_formateurs mf
    WHERE mf.formateur_id = v_target.trainer_id
      AND mf.statut IN (
        'accepte',
        'indisponible_affecte_ailleurs'
      )
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM public.mission_formateurs affected
      JOIN public.mission_dates affected_date
        ON affected_date.mission_id =
           affected.mission_id
      JOIN public.mission_dates option_date
        ON option_date.mission_id =
           v_conflict_row.mission_id
       AND option_date.date =
           affected_date.date
      WHERE affected.formateur_id =
            v_target.trainer_id
        AND affected.statut = 'affecte'
        AND affected.mission_id <>
            v_conflict_row.mission_id
    )
    INTO v_has_conflict;

    v_expected_status :=
      CASE
        WHEN v_has_conflict
          THEN 'indisponible_affecte_ailleurs'
        ELSE 'accepte'
      END;

    IF v_conflict_row.statut <> v_expected_status THEN
      UPDATE public.mission_formateurs
      SET
        statut = v_expected_status,
        affecte_le = null
      WHERE id = v_conflict_row.id;
    END IF;
  END LOOP;

  RETURN p_response;
END;
$function$;


-- 4. Public trainer -> organization invitation:
-- invitation links are valid for 14 days from the email-log creation.
CREATE OR REPLACE FUNCTION public.get_public_trainer_organization_invitation(
  p_token uuid
)
RETURNS TABLE(
  trainer_id uuid,
  trainer_first_name text,
  trainer_last_name text,
  organization_name text,
  recipient_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    t.id,
    t.prenom,
    t.nom,
    coalesce(e.metadata ->> 'organization_name', ''),
    e.recipient_email
  FROM public.email_logs e
  JOIN public.trainers t
    ON t.id =
       nullif(e.metadata ->> 'trainer_id', '')::uuid
  WHERE e.email_type =
        'trainer_organization_invitation'
    AND e.metadata ->> 'invitation_token' =
        p_token::text
    AND e.status IN (
      'sent',
      'delivered',
      'soft_bounce',
      'hard_bounce',
      'blocked',
      'invalid',
      'deferred'
    )
    AND coalesce(e.sent_at, e.created_at)
        + interval '14 days' > now()
  ORDER BY e.created_at DESC
  LIMIT 1;
$function$;


-- Preserve the intentional public-token ACLs explicitly.
REVOKE EXECUTE ON FUNCTION
  public.get_public_mission_proposal(uuid)
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION
  public.get_public_mission_change(uuid)
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION
  public.respond_to_public_mission_change(uuid, text, text)
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION
  public.get_public_trainer_organization_invitation(uuid)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.get_public_mission_proposal(uuid)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.get_public_mission_change(uuid)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.respond_to_public_mission_change(uuid, text, text)
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.get_public_trainer_organization_invitation(uuid)
TO anon, authenticated;
