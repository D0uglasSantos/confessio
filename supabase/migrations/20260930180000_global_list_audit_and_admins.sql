CREATE OR REPLACE FUNCTION private.global_list_audit_log(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
BEGIN
  IF NOT public.is_global_admin('viewer') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'entries',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', entry_row.id,
            'action', entry_row.action,
            'target_type', entry_row.target_type,
            'target_id', entry_row.target_id,
            'metadata', entry_row.metadata,
            'created_at', entry_row.created_at,
            'actor_email', entry_row.actor_email
          )
          ORDER BY entry_row.created_at DESC
        ),
        '[]'::jsonb
      )
    )
    FROM (
      SELECT
        pal.id,
        pal.action,
        pal.target_type,
        pal.target_id,
        pal.metadata,
        pal.created_at,
        u.email AS actor_email
      FROM public.platform_audit_log pal
      LEFT JOIN auth.users u ON u.id = pal.actor_user_id
      ORDER BY pal.created_at DESC
      LIMIT v_limit
    ) AS entry_row
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.global_list_audit_log(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_list_audit_log(p_limit);
$$;

CREATE OR REPLACE FUNCTION private.global_list_church_admins(p_church_id uuid)
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.churches c
    WHERE c.id = p_church_id
  ) THEN
    RAISE EXCEPTION 'CHURCH_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'admins',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_id', ca.user_id,
            'email', u.email,
            'created_at', ca.created_at
          )
          ORDER BY ca.created_at
        ),
        '[]'::jsonb
      )
    )
    FROM public.church_admins ca
    LEFT JOIN auth.users u ON u.id = ca.user_id
    WHERE ca.church_id = p_church_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.global_list_church_admins(p_church_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_list_church_admins(p_church_id);
$$;

GRANT EXECUTE ON FUNCTION private.global_list_audit_log(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_list_audit_log(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION private.global_list_church_admins(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_list_church_admins(uuid) TO authenticated;

REVOKE ALL ON FUNCTION private.global_list_audit_log(integer) FROM anon;
REVOKE ALL ON FUNCTION public.global_list_audit_log(integer) FROM anon;
REVOKE ALL ON FUNCTION private.global_list_church_admins(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.global_list_church_admins(uuid) FROM anon;

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
            'admin_emails', (
              SELECT coalesce(jsonb_agg(u.email ORDER BY u.email), '[]'::jsonb)
              FROM public.church_admins ca
              JOIN auth.users u ON u.id = ca.user_id
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

CREATE OR REPLACE FUNCTION private.global_list_church_sessions(p_church_id uuid)
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

  IF NOT EXISTS (
    SELECT 1 FROM public.churches c WHERE c.id = p_church_id
  ) THEN
    RAISE EXCEPTION 'CHURCH_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'sessions',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'status', s.status,
            'starts_at', s.starts_at
          )
          ORDER BY s.created_at DESC
        ),
        '[]'::jsonb
      )
    )
    FROM public.sessions s
    WHERE s.church_id = p_church_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.global_list_church_sessions(p_church_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_list_church_sessions(p_church_id);
$$;

GRANT EXECUTE ON FUNCTION private.global_list_church_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_list_church_sessions(uuid) TO authenticated;
REVOKE ALL ON FUNCTION private.global_list_church_sessions(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.global_list_church_sessions(uuid) FROM anon;
