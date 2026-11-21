# Arquitetura

Stack: Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, Supabase local (Postgres + Auth + Realtime).

## Concorrência no PostgreSQL

A próxima senha **não** é escolhida no frontend. Usar RPCs atômicas. `call_next_ticket` usa `FOR UPDATE SKIP LOCKED` para dois sacerdotes nunca receberem a mesma senha.

## RPCs da fila

`create_ticket`, `get_ticket_by_token`, `cancel_ticket` (só `WAITING`), `call_next_ticket`, `recall_ticket`, `start_service`, `finish_service`, `mark_no_show`, `pause_station`, `resume_station`, `get_public_session_state`, `get_station_state`, `admin_get_session_state`.

Estado público (TV/fiel) **não** inclui tokens nem telefone.

## Realtime

Realtime invalida e o cliente **refetcha a RPC**. Não enviar `anonymous_token`, `access_token` nem telefone no payload.

## Invariantes

- Um ticket ativo (`CALLED` / `IN_SERVICE`) por estação.
- `public_number` / `public_code` únicos por sessão.
- `starts_at` abre a fila (`DRAFT` → `OPEN`) se ninguém abriu antes. `ends_at` encerra só a entrada (`ENTRY_CLOSED`); não finaliza a sessão. O admin pode reabrir a entrada (`ENTRY_CLOSED` → `OPEN`); se o `ends_at` já passou, ele é limpo para a entrada não fechar de novo sozinha.
- Fiel e sacerdote sem conta no MVP. Só `/admin` usa Supabase Auth.

Detalhe de schema, estados e testes: [DATABASE.md](../DATABASE.md).
