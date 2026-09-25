-- QR / links públicos de rascunho mostram "fila ainda não aberta"
-- em vez de SESSION_NOT_FOUND. CANCELLED continua oculto.
CREATE OR REPLACE FUNCTION public.is_visible_session_status(p_status public.session_status)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_status IN ('DRAFT', 'OPEN', 'ENTRY_CLOSED', 'FINISHED');
$$;
