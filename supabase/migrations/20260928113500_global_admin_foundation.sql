CREATE TABLE public.global_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT global_admins_role_chk CHECK (role IN ('owner', 'operator', 'viewer'))
);

ALTER TABLE public.global_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_global_admin(p_required_role text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_admin AS (
    SELECT ga.role
    FROM public.global_admins ga
    WHERE ga.user_id = (SELECT auth.uid())
      AND ga.is_active = true
    LIMIT 1
  )
  SELECT EXISTS (
    SELECT 1
    FROM current_admin ca
    WHERE p_required_role IS NULL
      OR p_required_role = ''
      OR (
        p_required_role = 'viewer'
        AND ca.role IN ('viewer', 'operator', 'owner')
      )
      OR (
        p_required_role = 'operator'
        AND ca.role IN ('operator', 'owner')
      )
      OR (
        p_required_role = 'owner'
        AND ca.role = 'owner'
      )
  );
$$;

CREATE POLICY global_admins_select_self
ON public.global_admins
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY global_admins_select_global
ON public.global_admins
FOR SELECT
TO authenticated
USING (public.is_global_admin('operator'));

REVOKE ALL ON TABLE public.global_admins FROM anon, authenticated;
GRANT SELECT ON TABLE public.global_admins TO authenticated;

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

CREATE OR REPLACE FUNCTION private.global_create_church(
  p_name text,
  p_slug text,
  p_logo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id uuid;
BEGIN
  IF NOT public.is_global_admin('operator') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.churches (name, slug, logo_url)
  VALUES (trim(p_name), lower(trim(p_slug)), nullif(trim(p_logo_url), ''))
  RETURNING id INTO v_church_id;

  RETURN v_church_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.global_get_dashboard_metrics(
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to timestamptz DEFAULT now()
)
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
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'churches_total', (
      SELECT count(*)
      FROM public.churches
    ),
    'churches_with_active_session', (
      SELECT count(distinct s.church_id)
      FROM public.sessions s
      WHERE s.status IN ('OPEN', 'ENTRY_CLOSED')
    ),
    'sessions_opened_in_period', (
      SELECT count(*)
      FROM public.sessions s
      WHERE s.entry_opened_at IS NOT NULL
        AND s.entry_opened_at >= p_from
        AND s.entry_opened_at < p_to
    ),
    'tickets_created_in_period', (
      SELECT count(*)
      FROM public.tickets t
      WHERE t.created_at >= p_from
        AND t.created_at < p_to
    ),
    'no_show_rate_percent', (
      SELECT CASE
        WHEN count(*) = 0 THEN 0
        ELSE round(
          (
            count(*) FILTER (WHERE t.status = 'NO_SHOW')::numeric
            / count(*)::numeric
          ) * 100,
          2
        )
      END
      FROM public.tickets t
      WHERE t.created_at >= p_from
        AND t.created_at < p_to
    ),
    'average_service_minutes', (
      SELECT round(
        avg(
          extract(epoch FROM (t.finished_at - t.started_at)) / 60.0
        )::numeric,
        1
      )
      FROM public.tickets t
      WHERE t.status = 'COMPLETED'
        AND t.started_at IS NOT NULL
        AND t.finished_at IS NOT NULL
        AND t.finished_at > t.started_at
        AND t.finished_at >= p_from
        AND t.finished_at < p_to
    )
  )
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.global_assign_church_admin(
  p_church_id uuid,
  p_user_id uuid
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.churches c
    WHERE c.id = p_church_id
  ) THEN
    RAISE EXCEPTION 'CHURCH_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.church_admins (user_id, church_id)
  VALUES (p_user_id, p_church_id)
  ON CONFLICT (user_id)
  DO UPDATE SET church_id = EXCLUDED.church_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.global_list_churches()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_list_churches();
$$;

CREATE OR REPLACE FUNCTION public.global_create_church(
  p_name text,
  p_slug text,
  p_logo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_create_church(p_name, p_slug, p_logo_url);
$$;

CREATE OR REPLACE FUNCTION public.global_get_dashboard_metrics(
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_get_dashboard_metrics(p_from, p_to);
$$;

CREATE OR REPLACE FUNCTION public.global_assign_church_admin(
  p_church_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.global_assign_church_admin(p_church_id, p_user_id);
$$;

GRANT EXECUTE ON FUNCTION private.global_list_churches() TO authenticated;
GRANT EXECUTE ON FUNCTION private.global_create_church(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.global_get_dashboard_metrics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION private.global_assign_church_admin(uuid, uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_global_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_list_churches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_create_church(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_get_dashboard_metrics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_assign_church_admin(uuid, uuid) TO authenticated;
