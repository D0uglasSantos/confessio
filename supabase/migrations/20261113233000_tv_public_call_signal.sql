-- Expose call/recall timestamps on the public TV state so the board
-- can play a chime on every new call and every recall.

CREATE OR REPLACE FUNCTION private.get_public_session_state(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
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

  IF (
       v_session.status = 'DRAFT'
       AND v_session.starts_at IS NOT NULL
       AND v_session.starts_at <= clock_timestamp()
     )
     OR (
       v_session.status = 'OPEN'
       AND v_session.ends_at IS NOT NULL
       AND v_session.ends_at <= clock_timestamp()
     ) THEN
    v_session := private.sync_scheduled_session(v_session.id);
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
          'current_public_code', t.public_code,
          'called_at', t.called_at,
          'last_recalled_at', t.last_recalled_at
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
