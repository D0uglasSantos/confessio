-- When the scheduled ends_at arrives, persist ENTRY_CLOSED so no new
-- tickets can join. Existing WAITING/CALLED/IN_SERVICE tickets keep
-- being served until the admin finishes the session.

CREATE OR REPLACE FUNCTION private.close_entry_if_ended(p_session_id uuid)
RETURNS public.sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
BEGIN
  SELECT *
  INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_session.status = 'OPEN'
     AND v_session.ends_at IS NOT NULL
     AND v_session.ends_at <= clock_timestamp()
     AND private.church_is_active(v_session.church_id) THEN
    UPDATE public.sessions
    SET
      status = 'ENTRY_CLOSED',
      entry_closed_at = coalesce(entry_closed_at, clock_timestamp())
    WHERE id = p_session_id
      AND status = 'OPEN'
      AND ends_at IS NOT NULL
      AND ends_at <= clock_timestamp()
    RETURNING * INTO v_session;
  END IF;

  RETURN v_session;
END;
$$;

REVOKE ALL ON FUNCTION private.close_entry_if_ended(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.create_ticket(
  p_session_id uuid,
  p_existing_token uuid DEFAULT NULL,
  p_phone_e164 text DEFAULT NULL
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
  v_session := private.close_entry_if_ended(p_session_id);

  IF v_session IS NULL THEN
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
      PERFORM private.upsert_ticket_contact(v_existing.id, p_phone_e164);

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

  IF v_session.status <> 'OPEN'
     OR (
       v_session.ends_at IS NOT NULL
       AND v_session.ends_at <= clock_timestamp()
     ) THEN
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

  PERFORM private.upsert_ticket_contact(v_ticket.id, p_phone_e164);

  RETURN private.to_fiel_ticket(v_ticket, v_token, NULL);
END;
$$;

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

  v_session := private.close_entry_if_ended(p_session_id);

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_church_admin(v_session.church_id) THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  IF v_session.status <> 'OPEN'
     OR (
       v_session.ends_at IS NOT NULL
       AND v_session.ends_at <= clock_timestamp()
     ) THEN
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

  IF v_session.status = 'OPEN'
     AND v_session.ends_at IS NOT NULL
     AND v_session.ends_at <= clock_timestamp() THEN
    v_session := private.close_entry_if_ended(v_session.id);
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

CREATE OR REPLACE FUNCTION private.get_station_state(
  p_station_id uuid,
  p_access_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
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

  IF v_session.status = 'OPEN'
     AND v_session.ends_at IS NOT NULL
     AND v_session.ends_at <= clock_timestamp() THEN
    v_session := private.close_entry_if_ended(v_session.id);
  END IF;

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
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.get_station_state(p_station_id, p_access_token);
$$;

CREATE OR REPLACE FUNCTION private.admin_get_session_state(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
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

  IF v_session.status = 'OPEN'
     AND v_session.ends_at IS NOT NULL
     AND v_session.ends_at <= clock_timestamp() THEN
    v_session := private.close_entry_if_ended(v_session.id);
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
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.admin_get_session_state(p_session_id);
$$;
