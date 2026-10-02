-- Contato opcional do fiel para aviso de chamada no WhatsApp.
-- Fica fora de tickets para não vazar no SELECT público, Realtime ou telão.
-- A mesa do padre continua ligada só por tickets.station_id.

CREATE TABLE public.ticket_contacts (
  ticket_id uuid PRIMARY KEY REFERENCES public.tickets (id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ticket_contacts_phone_e164_format
    CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

CREATE TRIGGER ticket_contacts_set_updated_at
BEFORE UPDATE ON public.ticket_contacts
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.ticket_contacts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ticket_contacts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.normalize_phone_e164(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_digits text;
BEGIN
  IF p_phone IS NULL OR btrim(p_phone) = '' THEN
    RETURN NULL;
  END IF;

  v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');

  IF v_digits = '' THEN
    RAISE EXCEPTION 'INVALID_PHONE'
      USING ERRCODE = 'P0001';
  END IF;

  -- Celular ou fixo brasileiro sem DDI.
  IF v_digits ~ '^[1-9][0-9][0-9]{8,9}$' THEN
    v_digits := '55' || v_digits;
  END IF;

  IF v_digits !~ '^[1-9][0-9]{7,14}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN '+' || v_digits;
END;
$$;

CREATE OR REPLACE FUNCTION private.upsert_ticket_contact(
  p_ticket_id uuid,
  p_phone text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
BEGIN
  v_phone := private.normalize_phone_e164(p_phone);

  IF v_phone IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.ticket_contacts (ticket_id, phone_e164)
  VALUES (p_ticket_id, v_phone)
  ON CONFLICT (ticket_id) DO UPDATE
    SET phone_e164 = EXCLUDED.phone_e164
  RETURNING phone_e164 INTO v_phone;

  RETURN v_phone;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_ticket_whatsapp_target(p_ticket_id uuid)
RETURNS TABLE (
  ticket_id uuid,
  public_code text,
  phone_e164 text,
  phone_evolution text,
  station_id uuid,
  station_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.public_code,
    c.phone_e164,
    regexp_replace(c.phone_e164, '[^0-9]', '', 'g'),
    t.station_id,
    st.name
  FROM public.ticket_contacts c
  JOIN public.tickets t ON t.id = c.ticket_id
  LEFT JOIN public.stations st ON st.id = t.station_id
  WHERE t.id = p_ticket_id;
$$;

DROP FUNCTION IF EXISTS public.create_ticket(uuid, uuid);
DROP FUNCTION IF EXISTS private.create_ticket(uuid, uuid);

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

  PERFORM private.upsert_ticket_contact(v_ticket.id, p_phone_e164);

  RETURN private.to_fiel_ticket(v_ticket, v_token, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_ticket(
  p_session_id uuid,
  p_existing_token uuid DEFAULT NULL,
  p_phone_e164 text DEFAULT NULL
)
RETURNS public.fiel_ticket
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.create_ticket(p_session_id, p_existing_token, p_phone_e164);
$$;

GRANT EXECUTE ON FUNCTION public.create_ticket(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.create_ticket(uuid, uuid, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION private.normalize_phone_e164(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.upsert_ticket_contact(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.get_ticket_whatsapp_target(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_ticket_whatsapp_target(uuid) TO service_role;
