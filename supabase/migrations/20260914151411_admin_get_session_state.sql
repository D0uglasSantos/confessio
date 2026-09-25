CREATE OR REPLACE FUNCTION private.admin_get_session_state(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
  v_total bigint;
  v_waiting bigint;
  v_called bigint;
  v_in_service bigint;
  v_completed bigint;
  v_no_show bigint;
  v_cancelled bigint;
  v_avg_service numeric;
  v_avg_wait numeric;
  v_active_stations integer;
BEGIN
  SELECT *
  INTO v_session
  FROM public.sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_church_admin(v_session.church_id) THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'WAITING'),
    count(*) FILTER (WHERE status = 'CALLED'),
    count(*) FILTER (WHERE status = 'IN_SERVICE'),
    count(*) FILTER (WHERE status = 'COMPLETED'),
    count(*) FILTER (WHERE status = 'NO_SHOW'),
    count(*) FILTER (WHERE status = 'CANCELLED'),
    avg(
      extract(epoch FROM (finished_at - started_at)) / 60.0
    ) FILTER (
      WHERE status = 'COMPLETED'
        AND started_at IS NOT NULL
        AND finished_at IS NOT NULL
        AND finished_at > started_at
    ),
    avg(
      extract(epoch FROM (called_at - created_at)) / 60.0
    ) FILTER (
      WHERE called_at IS NOT NULL
        AND called_at > created_at
    )
  INTO
    v_total,
    v_waiting,
    v_called,
    v_in_service,
    v_completed,
    v_no_show,
    v_cancelled,
    v_avg_service,
    v_avg_wait
  FROM public.tickets
  WHERE session_id = p_session_id;

  SELECT count(*)::integer
  INTO v_active_stations
  FROM public.stations
  WHERE session_id = p_session_id
    AND status IN ('AVAILABLE', 'CALLING', 'BUSY');

  RETURN jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'slug', v_session.slug,
      'status', v_session.status,
      'starts_at', v_session.starts_at,
      'ends_at', v_session.ends_at,
      'show_waiting_queue_on_tv', v_session.show_waiting_queue_on_tv,
      'ticket_prefix', v_session.ticket_prefix
    ),
    'metrics', jsonb_build_object(
      'total', v_total,
      'waiting', v_waiting,
      'called', v_called,
      'in_service', v_in_service,
      'completed', v_completed,
      'no_show', v_no_show,
      'cancelled', v_cancelled,
      'active_stations', v_active_stations,
      'average_service_minutes', CASE
        WHEN v_avg_service IS NULL THEN NULL
        ELSE round(v_avg_service, 1)
      END,
      'average_wait_minutes', CASE
        WHEN v_avg_wait IS NULL THEN NULL
        ELSE round(v_avg_wait, 1)
      END
    ),
    'stations', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'priest_name', s.priest_name,
          'status', s.status
        )
        ORDER BY s.name
      ), '[]'::jsonb)
      FROM public.stations s
      WHERE s.session_id = p_session_id
    ),
    -- anonymous_token propositalmente NÃO é retornado
    'tickets', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'public_number', t.public_number,
          'public_code', t.public_code,
          'status', t.status,
          'station_id', t.station_id,
          'created_at', t.created_at,
          'called_at', t.called_at,
          'started_at', t.started_at,
          'finished_at', t.finished_at,
          'no_show_at', t.no_show_at,
          'cancelled_at', t.cancelled_at,
          'recall_count', t.recall_count
        )
        ORDER BY t.public_number
      ), '[]'::jsonb)
      FROM public.tickets t
      WHERE t.session_id = p_session_id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_session_state(p_session_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.admin_get_session_state(p_session_id);
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_session_state(uuid) TO authenticated;
