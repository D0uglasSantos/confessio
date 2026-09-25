CREATE OR REPLACE FUNCTION private.to_fiel_ticket(
  p_ticket public.tickets,
  p_token uuid,
  p_station_name text
)
RETURNS public.fiel_ticket
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (
    p_ticket.id,
    p_ticket.session_id,
    p_ticket.public_number,
    p_ticket.public_code,
    p_ticket.status,
    p_token,
    p_ticket.station_id,
    p_station_name,
    p_ticket.created_at,
    p_ticket.called_at,
    p_ticket.started_at,
    p_ticket.finished_at,
    p_ticket.cancelled_at,
    p_ticket.no_show_at
  )::public.fiel_ticket;
$$;

CREATE OR REPLACE FUNCTION private.assert_station_access(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.stations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
BEGIN
  SELECT s.*
  INTO v_station
  FROM public.stations s
  JOIN public.station_access sa ON sa.station_id = s.id
  WHERE s.id = p_station_id
    AND sa.access_token = p_access_token
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STATION_UNAUTHORIZED'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN v_station;
END;
$$;

CREATE OR REPLACE FUNCTION private.create_ticket(
  p_session_id uuid,
  p_existing_token uuid DEFAULT NULL
)
RETURNS public.fiel_ticket
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
  v_existing public.tickets;
  v_existing_token uuid;
  v_station_name text;
  v_next integer;
  v_code text;
  v_ticket public.tickets;
  v_token uuid;
BEGIN
  SELECT *
  INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_existing_token IS NOT NULL THEN
    SELECT t.*
    INTO v_existing
    FROM public.ticket_tokens tt
    JOIN public.tickets t ON t.id = tt.ticket_id
    WHERE tt.anonymous_token = p_existing_token
      AND t.session_id = p_session_id
      AND t.status IN ('WAITING', 'CALLED', 'IN_SERVICE');

    IF FOUND THEN
      SELECT tt.anonymous_token
      INTO v_existing_token
      FROM public.ticket_tokens tt
      WHERE tt.ticket_id = v_existing.id;

      SELECT st.name
      INTO v_station_name
      FROM public.stations st
      WHERE st.id = v_existing.station_id;

      RETURN private.to_fiel_ticket(v_existing, v_existing_token, v_station_name);
    END IF;
  END IF;

  IF v_session.status <> 'OPEN' THEN
    RAISE EXCEPTION 'SESSION_NOT_OPEN'
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.session_counters
  SET last_public_number = last_public_number + 1
  WHERE session_id = p_session_id
  RETURNING last_public_number INTO v_next;

  v_code := v_session.ticket_prefix || '-' || lpad(v_next::text, GREATEST(3, length(v_next::text)), '0');

  INSERT INTO public.tickets (session_id, public_number, public_code, status)
  VALUES (p_session_id, v_next, v_code, 'WAITING')
  RETURNING * INTO v_ticket;

  INSERT INTO public.ticket_tokens (ticket_id)
  VALUES (v_ticket.id)
  RETURNING anonymous_token INTO v_token;

  RETURN private.to_fiel_ticket(v_ticket, v_token, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION private.get_ticket_by_token(p_token uuid)
RETURNS public.fiel_ticket
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets;
  v_token uuid;
  v_station_name text;
BEGIN
  SELECT t.*
  INTO v_ticket
  FROM public.ticket_tokens tt
  JOIN public.tickets t ON t.id = tt.ticket_id
  WHERE tt.anonymous_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  SELECT tt.anonymous_token
  INTO v_token
  FROM public.ticket_tokens tt
  WHERE tt.ticket_id = v_ticket.id;

  SELECT st.name
  INTO v_station_name
  FROM public.stations st
  WHERE st.id = v_ticket.station_id;

  RETURN private.to_fiel_ticket(v_ticket, v_token, v_station_name);
END;
$$;

CREATE OR REPLACE FUNCTION private.cancel_ticket(p_token uuid)
RETURNS public.fiel_ticket
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets;
  v_token uuid;
BEGIN
  SELECT t.*
  INTO v_ticket
  FROM public.ticket_tokens tt
  JOIN public.tickets t ON t.id = tt.ticket_id
  WHERE tt.anonymous_token = p_token
  FOR UPDATE OF t;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  SELECT tt.anonymous_token
  INTO v_token
  FROM public.ticket_tokens tt
  WHERE tt.ticket_id = v_ticket.id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  IF v_ticket.status <> 'WAITING' THEN
    RAISE EXCEPTION 'TICKET_NOT_WAITING'
      USING ERRCODE = 'P0005';
  END IF;

  UPDATE public.tickets
  SET
    status = 'CANCELLED',
    cancelled_at = now()
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  RETURN private.to_fiel_ticket(v_ticket, v_token, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION private.call_next_ticket(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
  v_ticket public.tickets;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  IF v_station.status <> 'AVAILABLE' THEN
    RAISE EXCEPTION 'STATION_NOT_AVAILABLE'
      USING ERRCODE = 'P0006';
  END IF;

  SELECT t.*
  INTO v_ticket
  FROM public.tickets t
  WHERE t.session_id = v_station.session_id
    AND t.status = 'WAITING'
  ORDER BY t.public_number ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUEUE_EMPTY'
      USING ERRCODE = 'P0007';
  END IF;

  UPDATE public.tickets
  SET
    status = 'CALLED',
    station_id = v_station.id,
    called_at = now()
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE public.stations
  SET status = 'CALLING'
  WHERE id = v_station.id;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION private.recall_ticket(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
  v_ticket public.tickets;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  IF v_ticket.station_id <> v_station.id OR v_ticket.status <> 'CALLED' THEN
    RAISE EXCEPTION 'TICKET_NOT_CALLABLE'
      USING ERRCODE = 'P0008';
  END IF;

  UPDATE public.tickets
  SET
    last_recalled_at = now(),
    recall_count = recall_count + 1
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION private.start_service(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
  v_ticket public.tickets;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  IF v_ticket.station_id <> v_station.id OR v_ticket.status <> 'CALLED' THEN
    RAISE EXCEPTION 'TICKET_NOT_CALLED'
      USING ERRCODE = 'P0009';
  END IF;

  UPDATE public.tickets
  SET
    status = 'IN_SERVICE',
    started_at = now()
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE public.stations
  SET status = 'BUSY'
  WHERE id = v_station.id;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION private.finish_service(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
  v_ticket public.tickets;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  IF v_ticket.station_id <> v_station.id OR v_ticket.status <> 'IN_SERVICE' THEN
    RAISE EXCEPTION 'TICKET_NOT_IN_SERVICE'
      USING ERRCODE = 'P0010';
  END IF;

  UPDATE public.tickets
  SET
    status = 'COMPLETED',
    finished_at = now()
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE public.stations
  SET status = 'AVAILABLE'
  WHERE id = v_station.id;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION private.mark_no_show(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
  v_ticket public.tickets;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING ERRCODE = 'P0004';
  END IF;

  IF v_ticket.station_id <> v_station.id OR v_ticket.status <> 'CALLED' THEN
    RAISE EXCEPTION 'TICKET_NOT_CALLED'
      USING ERRCODE = 'P0009';
  END IF;

  UPDATE public.tickets
  SET
    status = 'NO_SHOW',
    no_show_at = now()
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE public.stations
  SET status = 'AVAILABLE'
  WHERE id = v_station.id;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION private.pause_station(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.stations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  IF v_station.status <> 'AVAILABLE' THEN
    RAISE EXCEPTION 'STATION_NOT_AVAILABLE'
      USING ERRCODE = 'P0006';
  END IF;

  UPDATE public.stations
  SET status = 'PAUSED'
  WHERE id = v_station.id
  RETURNING * INTO v_station;

  RETURN v_station;
END;
$$;

CREATE OR REPLACE FUNCTION private.resume_station(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.stations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.stations;
BEGIN
  v_station := private.assert_station_access(p_station_id, p_access_token);

  IF v_station.status <> 'PAUSED' THEN
    RAISE EXCEPTION 'STATION_NOT_PAUSED'
      USING ERRCODE = 'P0011';
  END IF;

  UPDATE public.stations
  SET status = 'AVAILABLE'
  WHERE id = v_station.id
  RETURNING * INTO v_station;

  RETURN v_station;
END;
$$;

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

  IF FOUND THEN
    SELECT c.name
    INTO v_church_name
    FROM public.churches c
    WHERE c.id = v_session.church_id;
  END IF;

  IF NOT FOUND OR NOT public.is_visible_session_status(v_session.status) THEN
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

CREATE OR REPLACE FUNCTION public.create_ticket(
  p_session_id uuid,
  p_existing_token uuid DEFAULT NULL
)
RETURNS public.fiel_ticket
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.create_ticket(p_session_id, p_existing_token);
$$;

CREATE OR REPLACE FUNCTION public.get_ticket_by_token(p_token uuid)
RETURNS public.fiel_ticket
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.get_ticket_by_token(p_token);
$$;

CREATE OR REPLACE FUNCTION public.cancel_ticket(p_token uuid)
RETURNS public.fiel_ticket
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.cancel_ticket(p_token);
$$;

CREATE OR REPLACE FUNCTION public.call_next_ticket(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.call_next_ticket(p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.recall_ticket(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.recall_ticket(p_ticket_id, p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.start_service(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.start_service(p_ticket_id, p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.finish_service(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.finish_service(p_ticket_id, p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.mark_no_show(
  p_ticket_id uuid,
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.tickets
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.mark_no_show(p_ticket_id, p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.pause_station(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.stations
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.pause_station(p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.resume_station(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS public.stations
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.resume_station(p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION public.get_public_session_state(p_slug text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.get_public_session_state(p_slug);
$$;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
