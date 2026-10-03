-- Coluna usada pela API externa de WhatsApp: envia quando
-- status = CALLED e whatsapp_sent_at IS NULL.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz;

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
    called_at = now(),
    whatsapp_sent_at = NULL
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
    recall_count = recall_count + 1,
    whatsapp_sent_at = NULL
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$;
