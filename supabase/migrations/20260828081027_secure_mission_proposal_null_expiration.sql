-- Security hardening:
-- a public mission proposal without an expiration date must be considered invalid.

CREATE OR REPLACE FUNCTION public.respond_to_mission_proposal(
  p_token uuid,
  p_response text,
  p_comment text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_expires_at timestamptz;
  v_trainer_user_id uuid;
BEGIN
  IF p_response NOT IN (
    'accepte',
    'refuse'
  ) THEN
    RAISE EXCEPTION
      'Réponse invalide.';
  END IF;

  SELECT
    mf.statut,
    mf.proposal_expires_at,
    t.user_id
  INTO
    v_status,
    v_expires_at,
    v_trainer_user_id
  FROM public.mission_formateurs mf
  JOIN public.trainers t
    ON t.id = mf.formateur_id
  WHERE mf.proposal_token = p_token
  FOR UPDATE OF mf;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Proposition introuvable.';
  END IF;

  IF
    v_expires_at IS NULL
    OR v_expires_at <= now()
  THEN
    RAISE EXCEPTION
      'Cette proposition a expiré.';
  END IF;

  IF
    v_status <>
    'proposition_envoyee'
  THEN
    RAISE EXCEPTION
      'Une réponse a déjà été enregistrée pour cette proposition.';
  END IF;

  /*
   * Si l'utilisateur authentifié est bien
   * le formateur concerné, on force le
   * contexte "trainer".
   *
   * Pour un lien public anonyme, aucun
   * utilisateur authentifié n'est disponible :
   * l'auteur restera "system".
   */
  IF
    auth.uid() IS NOT NULL
    AND v_trainer_user_id =
      auth.uid()
  THEN
    PERFORM set_config(
      'formaplane.actor_type',
      'trainer',
      true
    );
  END IF;

  UPDATE public.mission_formateurs
  SET
    statut = p_response,
    repondu_le = now(),
    response_comment =
      nullif(
        trim(p_comment),
        ''
      ),
    commentaire =
      coalesce(
        nullif(
          trim(p_comment),
          ''
        ),
        commentaire
      ),
    affecte_le = null
  WHERE proposal_token = p_token;

  RETURN p_response;
END;
$function$;

-- This is intentionally callable through a public proposal token,
-- but never through the PostgreSQL PUBLIC role.
REVOKE EXECUTE ON FUNCTION
  public.respond_to_mission_proposal(uuid, text, text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.respond_to_mission_proposal(uuid, text, text)
TO anon, authenticated;
