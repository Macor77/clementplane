-- Clementplane - Pre-launch security hardening
-- Remove inherited PUBLIC/anonymous execution from every SECURITY DEFINER
-- function, then explicitly restore only the intentional public token flows.

DO $block$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS function_signature
        FROM pg_proc p
        JOIN pg_namespace n
          ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',
            r.function_signature
        );
    END LOOP;
END;
$block$;

-- Intentional anonymous/token-based public flows.

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
