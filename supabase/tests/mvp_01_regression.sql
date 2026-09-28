-- Regressão executável do MVP-01 (fila + isolamento + admin global).
-- Requer seed local (sessão 7DHF92 aberta, admin@paroquia.local e global@plataforma.local).
-- Rode com: npm run test:db
-- O script aborta na primeira falha; tudo roda numa transação e é desfeito no fim.

BEGIN;

CREATE FUNCTION pg_temp.set_auth(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );
END;
$$;

CREATE FUNCTION pg_temp.assert(p_ok boolean, p_msg text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT coalesce(p_ok, false) THEN
    RAISE EXCEPTION 'ASSERT FAILED: %', p_msg;
  END IF;
END;
$$;

DO $$
DECLARE
  v_church_id uuid := '00000000-0000-0000-0000-000000000001';
  v_session_id uuid := '00000000-0000-0000-0000-000000000010';
  v_station_a uuid := '00000000-0000-0000-0000-000000000021';
  v_station_b uuid := '00000000-0000-0000-0000-000000000022';
  v_station_c uuid := '00000000-0000-0000-0000-000000000023';
  v_local_admin uuid := '00000000-0000-0000-0000-000000000099';
  v_global_admin uuid := '00000000-0000-0000-0000-000000000098';
  v_other_church uuid;
  v_other_session uuid;
  v_inactive_church uuid;
  v_inactive_session uuid;
  v_seen integer;
  v_token_a uuid;
  v_token_b uuid;
  v_token_c uuid;
  v_ticket_1 public.fiel_ticket;
  v_ticket_2 public.fiel_ticket;
  v_ticket_3 public.fiel_ticket;
  v_called_1 public.tickets;
  v_called_2 public.tickets;
  v_public jsonb;
  v_station_state jsonb;
  v_list jsonb;
  v_metrics jsonb;
  v_new_church uuid;
  v_err text;
BEGIN
  -- Isolamento: sessão CANCELLED de outra paróquia não aparece;
  -- UPDATE em sessão alheia não altera linha.
  INSERT INTO public.churches (name, slug)
  VALUES ('Paróquia Isolamento', 'isolamento-fase5')
  RETURNING id INTO v_other_church;

  INSERT INTO public.sessions (
    church_id, name, slug, status, ticket_prefix, starts_at
  )
  VALUES (
    v_other_church,
    'Sessão isolada',
    'ISO5A1',
    'CANCELLED',
    'X',
    now()
  )
  RETURNING id INTO v_other_session;

  PERFORM pg_temp.set_auth(v_local_admin);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT count(*)
  INTO v_seen
  FROM public.sessions
  WHERE id = v_other_session;

  UPDATE public.sessions
  SET name = 'tentativa-de-escrita-cruzada'
  WHERE id = v_other_session;

  IF NOT FOUND THEN
    NULL;
  END IF;

  RESET ROLE;

  PERFORM pg_temp.assert(v_seen = 0, 'church admin leaked foreign CANCELLED session');
  PERFORM pg_temp.assert(
    NOT EXISTS (
      SELECT 1
      FROM public.sessions
      WHERE id = v_other_session
        AND name = 'tentativa-de-escrita-cruzada'
    ),
    'church admin updated a foreign session'
  );

  -- Admin local não chama RPCs globais
  PERFORM pg_temp.set_auth(v_local_admin);
  BEGIN
    PERFORM public.global_list_churches();
    RAISE EXCEPTION 'church admin must not list churches globally';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%FORBIDDEN%' THEN
        RAISE EXCEPTION 'expected FORBIDDEN from global_list_churches, got %', v_err;
      END IF;
  END;

  -- Admin global: listar, cadastrar, métricas, editar
  PERFORM pg_temp.set_auth(v_global_admin);
  v_list := public.global_list_churches();
  PERFORM pg_temp.assert(
    jsonb_array_length(v_list -> 'churches') >= 1,
    'global_list_churches returned no parishes'
  );

  v_metrics := public.global_get_dashboard_metrics(now() - interval '30 days', now());
  PERFORM pg_temp.assert(v_metrics ? 'churches_total', 'metrics missing churches_total');
  PERFORM pg_temp.assert(v_metrics ? 'tickets_created_in_period', 'metrics missing tickets_created_in_period');

  v_new_church := public.global_create_church('Paróquia Fase 5', 'paroquia-fase-5', NULL);
  PERFORM pg_temp.assert(v_new_church IS NOT NULL, 'global_create_church returned null');

  PERFORM pg_temp.assert(
    public.global_update_church(v_new_church, 'Paróquia Fase 5 Atualizada', 'paroquia-fase-5', NULL),
    'global_update_church failed'
  );

  -- Desativar paróquia com sessão OPEN deve falhar
  BEGIN
    PERFORM public.global_set_church_active(v_church_id, false);
    RAISE EXCEPTION 'deactivating church with OPEN session must fail';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%CHURCH_HAS_ACTIVE_SESSION%' THEN
        RAISE EXCEPTION 'expected CHURCH_HAS_ACTIVE_SESSION, got %', v_err;
      END IF;
  END;

  -- Paróquia inativa: não cria sessão nem emite senha; estado público some
  v_inactive_church := public.global_create_church(
    'Paróquia Inativa',
    'paroquia-inativa-fase5',
    NULL
  );

  INSERT INTO public.sessions (
    church_id, name, slug, status, ticket_prefix, starts_at, entry_opened_at
  )
  VALUES (
    v_inactive_church,
    'Sessão inativa',
    'INAT5A',
    'OPEN',
    'I',
    now(),
    now()
  )
  RETURNING id INTO v_inactive_session;

  UPDATE public.churches
  SET is_active = false
  WHERE id = v_inactive_church;

  BEGIN
    INSERT INTO public.sessions (
      church_id, name, slug, status, ticket_prefix, starts_at
    )
    VALUES (
      v_inactive_church,
      'Nova sessão bloqueada',
      'INAT5B',
      'DRAFT',
      'I',
      now()
    );
    RAISE EXCEPTION 'inactive church must not accept new DRAFT sessions';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%CHURCH_INACTIVE%' THEN
        RAISE EXCEPTION 'expected CHURCH_INACTIVE on session insert, got %', v_err;
      END IF;
  END;

  BEGIN
    PERFORM public.create_ticket(v_inactive_session, NULL);
    RAISE EXCEPTION 'inactive church must not issue tickets';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%SESSION_NOT_OPEN%' THEN
        RAISE EXCEPTION 'expected SESSION_NOT_OPEN on inactive ticket, got %', v_err;
      END IF;
  END;

  BEGIN
    PERFORM public.get_public_session_state('INAT5A');
    RAISE EXCEPTION 'inactive church public session must be hidden';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%SESSION_NOT_FOUND%' THEN
        RAISE EXCEPTION 'expected SESSION_NOT_FOUND for inactive public session, got %', v_err;
      END IF;
  END;

  PERFORM pg_temp.assert(
    public.global_set_church_active(v_new_church, false),
    'deactivate church without live session failed'
  );
  PERFORM pg_temp.assert(
    public.global_set_church_active(v_new_church, true),
    'reactivate church failed'
  );

  -- Fila: entrar, chamar em dois confessionários, ciclo de atendimento
  SELECT access_token INTO v_token_a
  FROM public.station_access
  WHERE station_id = v_station_a;

  SELECT access_token INTO v_token_b
  FROM public.station_access
  WHERE station_id = v_station_b;

  SELECT access_token INTO v_token_c
  FROM public.station_access
  WHERE station_id = v_station_c;

  PERFORM pg_temp.assert(v_token_a IS NOT NULL, 'missing station A token');
  PERFORM pg_temp.assert(v_token_b IS NOT NULL, 'missing station B token');

  v_ticket_1 := public.create_ticket(v_session_id, NULL);
  v_ticket_2 := public.create_ticket(v_session_id, NULL);
  v_ticket_3 := public.create_ticket(v_session_id, NULL);

  PERFORM pg_temp.assert(v_ticket_1.public_code IS DISTINCT FROM v_ticket_2.public_code, 'duplicate public codes');
  PERFORM pg_temp.assert(v_ticket_1.anonymous_token IS NOT NULL, 'missing anonymous token');

  -- Token existente devolve a mesma senha
  PERFORM pg_temp.assert(
    (public.create_ticket(v_session_id, v_ticket_1.anonymous_token)).id = v_ticket_1.id,
    'create_ticket did not reuse existing waiting ticket'
  );

  v_called_1 := public.call_next_ticket(v_station_a, v_token_a);
  v_called_2 := public.call_next_ticket(v_station_b, v_token_b);

  PERFORM pg_temp.assert(v_called_1.id IS DISTINCT FROM v_called_2.id, 'two stations claimed the same ticket');
  PERFORM pg_temp.assert(v_called_1.status = 'CALLED', 'station A ticket not CALLED');
  PERFORM pg_temp.assert(v_called_2.status = 'CALLED', 'station B ticket not CALLED');

  BEGIN
    PERFORM public.call_next_ticket(v_station_a, v_token_a);
    RAISE EXCEPTION 'calling again on CALLING station must fail';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%STATION_NOT_AVAILABLE%' THEN
        RAISE EXCEPTION 'expected STATION_NOT_AVAILABLE, got %', v_err;
      END IF;
  END;

  PERFORM public.start_service(v_called_1.id, v_station_a, v_token_a);
  PERFORM public.finish_service(v_called_1.id, v_station_a, v_token_a);

  PERFORM pg_temp.assert(
    (public.cancel_ticket(v_ticket_3.anonymous_token)).status = 'CANCELLED',
    'cancel_ticket did not cancel WAITING ticket'
  );

  v_public := public.get_public_session_state('7DHF92');
  PERFORM pg_temp.assert(v_public #>> '{session,slug}' = '7DHF92', 'public session slug mismatch');
  PERFORM pg_temp.assert(
    (v_public -> 'session' ? 'church_name'),
    'public session missing church_name'
  );
  PERFORM pg_temp.assert(
    jsonb_typeof(v_public -> 'stations') = 'array',
    'public session missing stations'
  );

  v_station_state := public.get_station_state(v_station_b, v_token_b);
  PERFORM pg_temp.assert(v_station_state IS NOT NULL, 'get_station_state returned null');

  BEGIN
    PERFORM public.get_station_state(v_station_b, gen_random_uuid());
    RAISE EXCEPTION 'invalid priest token must fail';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%STATION_UNAUTHORIZED%' AND v_err NOT LIKE '%INVALID%' THEN
        RAISE EXCEPTION 'expected unauthorized station access, got %', v_err;
      END IF;
  END;

  BEGIN
    PERFORM public.call_next_ticket(v_station_c, v_token_c);
    RAISE EXCEPTION 'expected QUEUE_EMPTY after draining waiters';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%QUEUE_EMPTY%' THEN
        RAISE EXCEPTION 'expected QUEUE_EMPTY, got %', v_err;
      END IF;
  END;

  RAISE NOTICE 'MVP-01 regression passed';
END $$;

ROLLBACK;
