-- Clementplane - Pre-launch security hardening
-- Prevent an organization user from creating an availability note
-- for a trainer that is not referenced by their organization.

CREATE OR REPLACE FUNCTION public.create_organization_availability_note(
    p_organization_id uuid,
    p_trainer_id uuid,
    p_day date,
    p_content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_note_id uuid;
BEGIN
    IF NOT public.user_belongs_to_organization(p_organization_id) THEN
        RAISE EXCEPTION 'ORGANIZATION_ACCESS_DENIED';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.organization_trainers ot
        WHERE ot.organization_id = p_organization_id
          AND ot.trainer_id = p_trainer_id
    ) THEN
        RAISE EXCEPTION 'TRAINER_NOT_IN_ORGANIZATION';
    END IF;

    IF nullif(
        btrim(
            coalesce(
                p_content,
                ''
            )
        ),
        ''
    ) IS NULL THEN
        RAISE EXCEPTION 'NOTE_CONTENT_REQUIRED';
    END IF;

    INSERT INTO public.trainer_availability_notes (
        trainer_id,
        day,
        content,
        source,
        author_user_id,
        organization_id
    )
    VALUES (
        p_trainer_id,
        p_day,
        btrim(p_content),
        'organization',
        auth.uid(),
        p_organization_id
    )
    RETURNING id
    INTO new_note_id;

    RETURN new_note_id;
END;
$function$;
