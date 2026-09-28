-- Paróquias podem ser desativadas sem apagar histórico operacional.
-- Exclusão física (CASCADE em sessões/tickets) fica fora do MVP.

ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION private.global_list_churches()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_global_admin('viewer') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'churches',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'logo_url', c.logo_url,
            'is_active', c.is_active,
            'created_at', c.created_at,
            'admins_count', (
              SELECT count(*)
              FROM public.church_admins ca
              WHERE ca.church_id = c.id
            ),
            'sessions_total', (
              SELECT count(*)
              FROM public.sessions s
              WHERE s.church_id = c.id
            ),
            'sessions_open_now', (
              SELECT count(*)
              FROM public.sessions s
              WHERE s.church_id = c.id
                AND s.status IN ('OPEN', 'ENTRY_CLOSED')
            )
          )
          ORDER BY c.created_at DESC
        ),
        '[]'::jsonb
      )
    )
    FROM public.churches c
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.global_update_church(
  p_church_id uuid,
  p_name text,
  p_slug text,
  p_logo_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_global_admin('operator') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.churches
  SET
    name = trim(p_name),
    slug = lower(trim(p_slug)),
    logo_url = nullif(trim(p_logo_url), '')
  WHERE id = p_church_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHURCH_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM private.log_platform_action(
    'church.update',
    'church',
    p_church_id,
    jsonb_build_object('name', trim(p_name), 'slug', lower(trim(p_slug)))
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION private.global_set_church_active(
  p_church_id uuid,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_sessions bigint;
BEGIN
  IF NOT public.is_global_admin('operator') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  IF NOT p_is_active THEN
    SELECT count(*)
    INTO v_open_sessions
    FROM public.sessions s
    WHERE s.church_id = p_church_id
      AND s.status IN ('OPEN', 'ENTRY_CLOSED');

    IF v_open_sessions > 0 THEN
      RAISE EXCEPTION 'CHURCH_HAS_ACTIVE_SESSION'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE public.churches
  SET is_active = p_is_active
  WHERE id = p_church_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHURCH_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM private.log_platform_action(
    CASE WHEN p_is_active THEN 'church.activate' ELSE 'church.deactivate' END,
    'church',
    p_church_id,
    jsonb_build_object('is_active', p_is_active)
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.global_update_church(
  p_church_id uuid,
  p_name text,
  p_slug text,
  p_logo_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_update_church(p_church_id, p_name, p_slug, p_logo_url);
$$;

CREATE OR REPLACE FUNCTION public.global_set_church_active(
  p_church_id uuid,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_set_church_active(p_church_id, p_is_active);
$$;

GRANT EXECUTE ON FUNCTION private.global_update_church(uuid, text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.global_set_church_active(uuid, boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_update_church(uuid, text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_set_church_active(uuid, boolean)
  TO authenticated;
