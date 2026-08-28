-- Clementplane - Pre-launch security hardening
-- 1. Protect mission proposal creation
-- 2. Remove anonymous access from SECURITY DEFINER RPCs
--    except intentional public token-based flows
-- 3. Prevent direct API execution of trigger functions

CREATE OR REPLACE FUNCTION public.create_mission_proposal(
    p_mission_formateur_id uuid,
    p_expires_at timestamptz DEFAULT (now() + interval '14 days')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_token uuid;
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.mission_formateurs mf
        JOIN public.missions m
          ON m.id = mf.mission_id
        JOIN public.organization_members om
          ON om.organization_id = m.organization_id
         AND om.user_id = v_user_id
         AND om.status = 'active'
        WHERE mf.id = p_mission_formateur_id
    ) THEN
        RAISE EXCEPTION 'MISSION_ACCESS_DENIED';
    END IF;

    UPDATE public.mission_formateurs
    SET
        proposal_token = coalesce(proposal_token, gen_random_uuid()),
        proposal_expires_at = coalesce(
            p_expires_at,
            now() + interval '14 days'
        ),
        proposal_viewed_at = null,
        response_comment = null,
        statut = 'proposition_envoyee',
        propose_le = coalesce(propose_le, now()),
        repondu_le = null,
        affecte_le = null
    WHERE id = p_mission_formateur_id
      AND statut IN (
          'selectionne',
          'proposition_envoyee',
          'refuse',
          'annule'
      )
    RETURNING proposal_token INTO v_token;

    IF v_token IS NULL THEN
        RAISE EXCEPTION
          'Cette proposition ne peut pas être préparée dans son état actuel.';
    END IF;

    RETURN v_token;
END;
$function$;


-- Remove anonymous access from every SECURITY DEFINER function,
-- except the public functions deliberately accessible through
-- secure UUID tokens contained in e-mail links.
DO $block$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT
            p.oid::regprocedure AS function_signature,
            p.proname
        FROM pg_proc p
        JOIN pg_namespace n
          ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
          AND p.proname NOT IN (
              'get_public_mission_change',
              'get_public_mission_proposal',
              'get_public_trainer_organization_invitation',
              'respond_to_mission_proposal',
              'respond_to_public_mission_change',
              'unsubscribe_feature_news'
          )
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION %s FROM anon',
            r.function_signature
        );
    END LOOP;
END;
$block$;


-- Explicitly preserve the intended public/token flows.
GRANT EXECUTE
ON FUNCTION public.get_public_mission_change(uuid)
TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_public_mission_proposal(uuid)
TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_public_trainer_organization_invitation(uuid)
TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.respond_to_mission_proposal(uuid, text, text)
TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.respond_to_public_mission_change(uuid, text, text)
TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.unsubscribe_feature_news(uuid)
TO anon, authenticated;


-- Trigger functions are internal database mechanisms.
-- Signed-in users must not be able to call them directly via /rpc.
REVOKE EXECUTE
ON FUNCTION public.handle_new_user()
FROM anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.log_mission_trainer_history()
FROM anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.log_trainer_availability_change()
FROM anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.prepare_trainer_availability_contact()
FROM anon, authenticated;
