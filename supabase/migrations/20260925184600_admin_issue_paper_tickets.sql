CREATE TABLE public.paper_print_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches (id) ON DELETE CASCADE,
  ticket_count integer NOT NULL,
  first_public_number integer NOT NULL,
  last_public_number integer NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT paper_print_batches_count_chk CHECK (
    ticket_count >= 50
    AND ticket_count <= 500
    AND ticket_count % 50 = 0
  ),
  CONSTRAINT paper_print_batches_range_chk CHECK (
    last_public_number >= first_public_number
  )
);

CREATE TABLE public.paper_print_batch_tickets (
  batch_id uuid NOT NULL REFERENCES public.paper_print_batches (id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  PRIMARY KEY (batch_id, ticket_id)
);

CREATE INDEX paper_print_batches_session_id_idx
  ON public.paper_print_batches (session_id, created_at DESC);

ALTER TABLE public.paper_print_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_print_batch_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY paper_print_batches_select_admin
ON public.paper_print_batches
FOR SELECT
TO authenticated
USING (public.is_church_admin(church_id));

CREATE POLICY paper_print_batch_tickets_select_admin
ON public.paper_print_batch_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.paper_print_batches b
    WHERE b.id = batch_id
      AND public.is_church_admin(b.church_id)
  )
);

REVOKE ALL ON TABLE public.paper_print_batches FROM anon, authenticated;
REVOKE ALL ON TABLE public.paper_print_batch_tickets FROM anon, authenticated;

GRANT SELECT ON TABLE public.paper_print_batches TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_issue_paper_tickets(
  p_session_id uuid,
  p_count integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
  v_user_id uuid;
  v_last integer;
  v_first integer;
  v_batch_id uuid;
BEGIN
  v_user_id := (SELECT auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  IF p_count IS NULL
     OR p_count < 50
     OR p_count > 500
     OR (p_count % 50) <> 0 THEN
    RAISE EXCEPTION 'INVALID_PAPER_TICKET_COUNT'
      USING ERRCODE = 'P0003';
  END IF;

  SELECT *
  INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_church_admin(v_session.church_id) THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  IF v_session.status <> 'OPEN' THEN
    RAISE EXCEPTION 'SESSION_NOT_OPEN'
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.session_counters
  SET last_public_number = last_public_number + p_count
  WHERE session_id = p_session_id
  RETURNING last_public_number INTO v_last;

  IF v_last IS NULL THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  v_first := v_last - p_count + 1;

  INSERT INTO public.tickets (session_id, public_number, public_code, status)
  SELECT
    p_session_id,
    n,
    v_session.ticket_prefix || '-' || lpad(
      n::text,
      GREATEST(3, length(n::text)),
      '0'
    ),
    'WAITING'
  FROM generate_series(v_first, v_last) AS n;

  INSERT INTO public.ticket_tokens (ticket_id)
  SELECT t.id
  FROM public.tickets t
  WHERE t.session_id = p_session_id
    AND t.public_number BETWEEN v_first AND v_last
    AND NOT EXISTS (
      SELECT 1
      FROM public.ticket_tokens tt
      WHERE tt.ticket_id = t.id
    );

  INSERT INTO public.paper_print_batches (
    session_id,
    church_id,
    ticket_count,
    first_public_number,
    last_public_number,
    created_by
  )
  VALUES (
    p_session_id,
    v_session.church_id,
    p_count,
    v_first,
    v_last,
    v_user_id
  )
  RETURNING id INTO v_batch_id;

  INSERT INTO public.paper_print_batch_tickets (batch_id, ticket_id)
  SELECT v_batch_id, t.id
  FROM public.tickets t
  WHERE t.session_id = p_session_id
    AND t.public_number BETWEEN v_first AND v_last;

  RETURN v_batch_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_get_print_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.paper_print_batches;
  v_session public.sessions;
  v_church_name text;
BEGIN
  SELECT *
  INTO v_batch
  FROM public.paper_print_batches
  WHERE id = p_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRINT_BATCH_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_church_admin(v_batch.church_id) THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_session
  FROM public.sessions
  WHERE id = v_batch.session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT name
  INTO v_church_name
  FROM public.churches
  WHERE id = v_batch.church_id;

  RETURN jsonb_build_object(
    'batch_id', v_batch.id,
    'session_id', v_session.id,
    'session_name', v_session.name,
    'session_slug', v_session.slug,
    'church_name', coalesce(v_church_name, ''),
    'ticket_count', v_batch.ticket_count,
    'first_public_number', v_batch.first_public_number,
    'last_public_number', v_batch.last_public_number,
    'created_at', v_batch.created_at,
    'tickets', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'public_code', t.public_code,
          'public_number', t.public_number,
          'token', tt.anonymous_token
        )
        ORDER BY t.public_number
      ), '[]'::jsonb)
      FROM public.paper_print_batch_tickets bt
      JOIN public.tickets t ON t.id = bt.ticket_id
      JOIN public.ticket_tokens tt ON tt.ticket_id = t.id
      WHERE bt.batch_id = v_batch.id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_issue_paper_tickets(
  p_session_id uuid,
  p_count integer
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.admin_issue_paper_tickets(p_session_id, p_count);
$$;

CREATE OR REPLACE FUNCTION public.admin_get_print_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.admin_get_print_batch(p_batch_id);
$$;

GRANT EXECUTE ON FUNCTION private.admin_issue_paper_tickets(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_get_print_batch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_issue_paper_tickets(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_print_batch(uuid) TO authenticated;
