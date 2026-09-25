# Fila de Confissões

Sistema web/PWA para organizar filas de confissão em paróquias. O fiel entra pelo QR Code, recebe uma senha anônima e acompanha a chamada em tempo real.

Este repositório está na **Fase 7 (Polish de concorrência)**: app Next.js + schema/RPCs no Supabase **local** + admin/fiel/padre/TV + métricas + PWA, com refetch debounced e mutações anti double-tap. Não há projeto remoto nem domínio próprio nesta etapa.

## Princípios

- O fiel não cria conta e não informa nome, telefone ou e-mail.
- O sistema gerencia fila, senhas e confessionários. Nunca armazena conteúdo da confissão.
- Regras críticas de concorrência ficam no PostgreSQL, não no cliente.

Diretrizes obrigatórias: [docs/diretrizes](docs/diretrizes). Padrão de Git: [docs/git.md](docs/git.md). Spec do banco: [docs/DATABASE.md](docs/DATABASE.md).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase local (Postgres + Auth + Realtime)

## Pré-requisitos

- Node.js 20+
- Docker Desktop em execução
- npm

## Como rodar

```bash
cp .env.example .env.local
npm install
npm run db:start
npm run db:reset
npm run db:types
npm run dev
```

URLs locais:

- App: [http://localhost:3000](http://localhost:3000)
- Supabase API: [http://127.0.0.1:54321](http://127.0.0.1:54321)
- Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)

O seed cria a paróquia de exemplo, a sessão `7DHF92` (aberta), três confessionários e o admin local:

- e-mail: `admin@paroquia.local`
- senha: `admin123`

## RPCs da fila

| Função | Uso |
| --- | --- |
| `create_ticket` | Entra na fila e devolve senha + token anônimo |
| `get_ticket_by_token` | Lê o ticket do fiel pelo token |
| `cancel_ticket` | Cancela apenas se estiver `WAITING` |
| `call_next_ticket` | Chama o próximo com `FOR UPDATE SKIP LOCKED` |
| `recall_ticket` | Chama novamente |
| `start_service` / `finish_service` | Ciclo de atendimento |
| `mark_no_show` | Não compareceu |
| `pause_station` / `resume_station` | Pausa do confessionário |
| `get_public_session_state` | Estado público da TV/fiel, sem tokens |
| `get_station_state` | Estado do confessionário (exige `access_token`) |
| `admin_get_session_state` | Métricas e tickets da sessão (admin autenticado) |

Tokens (`anonymous_token`, `access_token`) ficam em tabelas separadas e fora do Realtime.

## Rotas

- `/s/[slug]` — entrada do fiel
- `/s/[slug]/minha-senha` — acompanhamento
- `/padre/[stationId]` — painel do sacerdote
- `/tv/[sessionSlug]` — telão
- `/admin` — administração (login local)
- `/admin/sessoes/[sessionId]` — operação da sessão

## PWA

- Manifest em `/manifest.webmanifest` (`src/app/manifest.ts`)
- Ícones em `public/icons/` + `app/icon.tsx`
- Service worker em `public/sw.js` (registrado só em produção): cache mínimo do shell; a fila continua online via Supabase

## Responsividade

- **Fiel e padre:** mobile-first (safe areas, botões grandes, tipografia fluida)
- **TV / telão:** layout landscape com tipografia em `vw`/`vmin` para 1080p+
- **Admin:** desktop-first (secretaria da paróquia)

## Concorrência na UI

- RPCs atômicas no Postgres (`FOR UPDATE SKIP LOCKED` em `call_next_ticket`)
- Debounce 200ms + sequência de refetch nos hooks realtime (ignora respostas stale)
- Refetch ao reconnect (`SUBSCRIBED`)
- Lock síncrono anti double-tap em entrar na fila / ações do padre / cancelar / admin
- Confirmação em no-show e finalizar atendimento
- Mapper central de erros em `src/lib/queue/errors.ts`
- Roteiro manual: `supabase/tests/queue_concurrency.sql`

## Próximas fases

Retenção/agregação de métricas (V2) → deploy remoto.
