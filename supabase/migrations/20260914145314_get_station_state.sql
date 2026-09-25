CREATE OR REPLACE FUNCTION private.get_station_state(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
  v_session public.sessions;
  v_waiting_count integer;
  v_current_ticket jsonb;
BEGIN
  SELECT s.*
  INTO v_station
  FROM public.stations s
  JOIN public.station_access sa ON sa.station_id = s.id
  WHERE s.id = p_station_id
    AND sa.access_token = p_access_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STATION_UNAUTHORIZED'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_session
  FROM public.sessions
  WHERE id = v_station.session_id;

  SELECT count(*)::integer
  INTO v_waiting_count
  FROM public.tickets
  WHERE session_id = v_station.session_id
    AND status = 'WAITING';

  SELECT jsonb_build_object(
    'id', t.id,
    'public_code', t.public_code,
    'public_number', t.public_number,
    'status', t.status,
    'called_at', t.called_at,
    'last_recalled_at', t.last_recalled_at,
    'started_at', t.started_at,
    'recall_count', t.recall_count
  )
  INTO v_current_ticket
  FROM public.tickets t
  WHERE t.station_id = v_station.id
    AND t.status IN ('CALLED', 'IN_SERVICE')
  ORDER BY t.called_at DESC NULLS LAST
  LIMIT 1;

  RETURN jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'slug', v_session.slug,
      'status', v_session.status
    ),
    'station', jsonb_build_object(
      'id', v_station.id,
      'name', v_station.name,
      'priest_name', v_station.priest_name,
      'status', v_station.status
    ),
    'waiting_count', v_waiting_count,
    'current_ticket', v_current_ticket
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_station_state(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.get_station_state(p_station_id, p_access_token);
$$;

GRANT EXECUTE ON FUNCTION public.get_station_state(uuid, uuid) TO anon, authenticated;
