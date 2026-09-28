-- Desativar paróquia impede operação nova. Histórico (sessões encerradas) permanece.

CREATE OR REPLACE FUNCTION private.church_is_active(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.churches c
    WHERE c.id = p_church_id
      AND c.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.enforce_active_church_on_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('DRAFT', 'OPEN', 'ENTRY_CLOSED')
     AND NOT private.church_is_active(NEW.church_id) THEN
    RAISE EXCEPTION 'CHURCH_INACTIVE'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sessions_require_active_church ON public.sessions;
CREATE TRIGGER sessions_require_active_church
BEFORE INSERT OR UPDATE OF status, church_id ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION private.enforce_active_church_on_sessions();

CREATE OR REPLACE FUNCTION private.enforce_active_church_on_waiting_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id uuid;
BEGIN
  IF NEW.status <> 'WAITING' THEN
    RETURN NEW;
  END IF;

  SELECT s.church_id
  INTO v_church_id
  FROM public.sessions s
  WHERE s.id = NEW.session_id;

  IF v_church_id IS NULL OR NOT private.church_is_active(v_church_id) THEN
    RAISE EXCEPTION 'SESSION_NOT_OPEN'
      USING ERRCODE = 'P0003';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_require_active_church ON public.tickets;
CREATE TRIGGER tickets_require_active_church
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION private.enforce_active_church_on_waiting_tickets();

CREATE OR REPLACE FUNCTION private.get_public_session_state(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
  v_church_name text;
BEGIN
  SELECT s.*
  INTO v_session
  FROM public.sessions s
  WHERE s.slug = p_slug;

  IF NOT FOUND OR NOT public.is_visible_session_status(v_session.status) THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT c.name
  INTO v_church_name
  FROM public.churches c
  WHERE c.id = v_session.church_id
    AND c.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'slug', v_session.slug,
      'status', v_session.status,
      'show_waiting_queue_on_tv', v_session.show_waiting_queue_on_tv,
      'church_name', v_church_name
    ),
    'stations', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', st.id,
          'name', st.name,
          'priest_name', st.priest_name,
          'status', st.status,
          'current_public_code', t.public_code
        )
        ORDER BY st.name
      ), '[]'::jsonb)
      FROM public.stations st
      LEFT JOIN public.tickets t
        ON t.station_id = st.id
       AND t.status IN ('CALLED', 'IN_SERVICE')
      WHERE st.session_id = v_session.id
    ),
    'waiting_count', (
      SELECT count(*)::integer
      FROM public.tickets
      WHERE session_id = v_session.id
        AND status = 'WAITING'
    ),
    'waiting_codes', CASE
      WHEN v_session.show_waiting_queue_on_tv THEN (
        SELECT coalesce(jsonb_agg(public_code ORDER BY public_number), '[]'::jsonb)
        FROM public.tickets
        WHERE session_id = v_session.id
          AND status = 'WAITING'
      )
      ELSE '[]'::jsonb
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION private.church_is_active(uuid) TO anon, authenticated;
