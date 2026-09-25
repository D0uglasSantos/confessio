# Arquitetura

Stack: Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Supabase local (Postgres + Auth + Realtime).

## Concorrência no PostgreSQL

A próxima senha **não** é escolhida no frontend. Usar RPCs atômicas. `call_next_ticket` usa `FOR UPDATE SKIP LOCKED` para dois sacerdotes nunca receberem a mesma senha.

## RPCs da fila

`create_ticket`, `get_ticket_by_token`, `cancel_ticket` (só `WAITING`), `call_next_ticket`, `recall_ticket`, `start_service`, `finish_service`, `mark_no_show`, `pause_station`, `resume_station`, `get_public_session_state`, `get_station_state`, `admin_get_session_state`.

Estado público (TV/fiel) **não** inclui tokens.

## Realtime

Realtime invalida e o cliente **refetcha a RPC**. Não enviar `anonymous_token` nem `access_token` no payload.

## Invariantes

- Um ticket ativo (`CALLED` / `IN_SERVICE`) por estação.
- `public_number` / `public_code` únicos por sessão.
- Fiel e sacerdote sem conta no MVP. Só `/admin` usa Supabase Auth.

Detalhe de schema, estados e testes: [DATABASE.md](../DATABASE.md).
