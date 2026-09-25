CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TYPE public.session_status AS ENUM (
  'DRAFT',
  'OPEN',
  'ENTRY_CLOSED',
  'FINISHED',
  'CANCELLED'
);

CREATE TYPE public.station_status AS ENUM (
  'OFFLINE',
  'AVAILABLE',
  'CALLING',
  'BUSY',
  'PAUSED'
);

CREATE TYPE public.ticket_status AS ENUM (
  'WAITING',
  'CALLED',
  'IN_SERVICE',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED'
);

CREATE TYPE public.fiel_ticket AS (
  id uuid,
  session_id uuid,
  public_number integer,
  public_code text,
  status public.ticket_status,
  anonymous_token uuid,
  station_id uuid,
  station_name text,
  created_at timestamptz,
  called_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  no_show_at timestamptz
);

CREATE TABLE public.churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status public.session_status NOT NULL DEFAULT 'DRAFT',
  ticket_prefix text NOT NULL DEFAULT 'C',
  starts_at timestamptz,
  ends_at timestamptz,
  entry_opened_at timestamptz,
  entry_closed_at timestamptz,
  finished_at timestamptz,
  show_waiting_queue_on_tv boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  name text NOT NULL,
  priest_name text,
  status public.station_status NOT NULL DEFAULT 'OFFLINE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.station_access (
  station_id uuid PRIMARY KEY REFERENCES public.stations (id) ON DELETE CASCADE,
  access_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  public_number integer NOT NULL,
  public_code text NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'WAITING',
  station_id uuid REFERENCES public.stations (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  last_recalled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  no_show_at timestamptz,
  recall_count integer NOT NULL DEFAULT 0,
  UNIQUE (session_id, public_number),
  UNIQUE (session_id, public_code)
);

CREATE TABLE public.ticket_tokens (
  ticket_id uuid PRIMARY KEY REFERENCES public.tickets (id) ON DELETE CASCADE,
  anonymous_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.session_counters (
  session_id uuid PRIMARY KEY REFERENCES public.sessions (id) ON DELETE CASCADE,
  last_public_number integer NOT NULL DEFAULT 0
);

CREATE TABLE public.church_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tickets_session_id_status_idx ON public.tickets (session_id, status);
CREATE INDEX tickets_session_id_public_number_idx ON public.tickets (session_id, public_number);
CREATE INDEX stations_session_id_status_idx ON public.stations (session_id, status);
CREATE INDEX ticket_tokens_anonymous_token_idx ON public.ticket_tokens (anonymous_token);

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sessions_set_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER stations_set_updated_at
BEFORE UPDATE ON public.stations
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.create_session_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.session_counters (session_id, last_public_number)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sessions_create_counter
AFTER INSERT ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION private.create_session_counter();

CREATE OR REPLACE FUNCTION private.create_station_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.station_access (station_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER stations_create_access
AFTER INSERT ON public.stations
FOR EACH ROW
EXECUTE FUNCTION private.create_station_access();

CREATE OR REPLACE FUNCTION public.is_visible_session_status(p_status public.session_status)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_status IN ('OPEN', 'ENTRY_CLOSED', 'FINISHED');
$$;

CREATE OR REPLACE FUNCTION public.is_church_admin(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_admins
    WHERE user_id = (SELECT auth.uid())
      AND church_id = p_church_id
  );
$$;

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY churches_select_public
ON public.churches
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY churches_all_admin
ON public.churches
FOR ALL
TO authenticated
USING (public.is_church_admin(id))
WITH CHECK (public.is_church_admin(id));

CREATE POLICY sessions_select_visible
ON public.sessions
FOR SELECT
TO anon, authenticated
USING (
  public.is_visible_session_status(status)
  OR public.is_church_admin(church_id)
);

CREATE POLICY sessions_all_admin
ON public.sessions
FOR ALL
TO authenticated
USING (public.is_church_admin(church_id))
WITH CHECK (public.is_church_admin(church_id));

CREATE POLICY stations_select_visible
ON public.stations
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND (
        public.is_visible_session_status(s.status)
        OR public.is_church_admin(s.church_id)
      )
  )
);

CREATE POLICY stations_all_admin
ON public.stations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND public.is_church_admin(s.church_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND public.is_church_admin(s.church_id)
  )
);

CREATE POLICY tickets_select_visible
ON public.tickets
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND (
        public.is_visible_session_status(s.status)
        OR public.is_church_admin(s.church_id)
      )
  )
);

CREATE POLICY tickets_all_admin
ON public.tickets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND public.is_church_admin(s.church_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND public.is_church_admin(s.church_id)
  )
);

CREATE POLICY station_access_select_admin
ON public.station_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.stations st
    JOIN public.sessions s ON s.id = st.session_id
    WHERE st.id = station_id
      AND public.is_church_admin(s.church_id)
  )
);

CREATE POLICY church_admins_select_own
ON public.church_admins
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

REVOKE ALL ON TABLE public.churches FROM anon, authenticated;
REVOKE ALL ON TABLE public.sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.stations FROM anon, authenticated;
REVOKE ALL ON TABLE public.tickets FROM anon, authenticated;
REVOKE ALL ON TABLE public.station_access FROM anon, authenticated;
REVOKE ALL ON TABLE public.ticket_tokens FROM anon, authenticated;
REVOKE ALL ON TABLE public.session_counters FROM anon, authenticated;
REVOKE ALL ON TABLE public.church_admins FROM anon, authenticated;

GRANT SELECT ON TABLE public.churches TO anon, authenticated;
GRANT SELECT ON TABLE public.sessions TO anon, authenticated;
GRANT SELECT ON TABLE public.stations TO anon, authenticated;
GRANT SELECT ON TABLE public.tickets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.churches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tickets TO authenticated;
GRANT SELECT ON TABLE public.station_access TO authenticated;
GRANT SELECT ON TABLE public.church_admins TO authenticated;

GRANT USAGE ON TYPE public.session_status TO anon, authenticated;
GRANT USAGE ON TYPE public.station_status TO anon, authenticated;
GRANT USAGE ON TYPE public.ticket_status TO anon, authenticated;
GRANT USAGE ON TYPE public.fiel_ticket TO anon, authenticated;
