CREATE TABLE public.platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX platform_audit_log_created_at_idx
  ON public.platform_audit_log (created_at DESC);

ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_audit_log_select_global
ON public.platform_audit_log
FOR SELECT
TO authenticated
USING (public.is_global_admin('operator'));

REVOKE ALL ON TABLE public.platform_audit_log FROM anon, authenticated;
GRANT SELECT ON TABLE public.platform_audit_log TO authenticated;

-- Nunca registrar dados de fiéis/confissão aqui. Somente ações
-- administrativas de plataforma (paróquia/admin), sempre com ator
-- identificado por auth.uid().
CREATE OR REPLACE FUNCTION private.log_platform_action(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_audit_log (
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    (SELECT auth.uid()),
    p_action,
    p_target_type,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION private.log_platform_action(text, text, uuid, jsonb)
  TO authenticated;

-- Reforça auditoria mínima nas ações globais críticas já existentes.

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

  PERFORM private.log_platform_action(
    'church.create',
    'church',
    v_church_id,
    jsonb_build_object('name', trim(p_name), 'slug', lower(trim(p_slug)))
  );

  RETURN v_church_id;
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

  PERFORM private.log_platform_action(
    'church_admin.assign',
    'church',
    p_church_id,
    jsonb_build_object('assigned_user_id', p_user_id)
  );

  RETURN true;
END;
$$;
