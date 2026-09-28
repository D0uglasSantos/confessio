# MVP 01 — Checklist de entrega

Status: validado para as primeiras paróquias reais, ainda no deploy Vercel.

Este documento fecha a Fase 5 do ciclo `mvp-01-profissional-multi-paroquia.md`.

## O que entra neste MVP

- Fila anônima do fiel, painel do sacerdote, telão e secretaria da paróquia.
- Home institucional (sem lançador e sem token de confessionário).
- Várias paróquias no mesmo sistema, isoladas por `church_id`.
- Admin global em `/admin/global`: cadastrar, editar, desativar paróquia, vincular admin local e ver métricas agregadas.

## O que não entra

- Billing, app nativo, white-label profundo, exclusão física de paróquia.

## Regressão obrigatória

Rodar contra o Supabase local com o seed padrão:

```bash
npm run db:start
npm run db:reset
npm run test:db
```

O script `supabase/tests/mvp_01_regression.sql` cobre:

- isolamento entre paróquias (admin local não vê sessão `CANCELLED` alheia nem altera a sessão de outro tenant);
- admin local sem acesso às RPCs globais (`FORBIDDEN`);
- cadastro, edição, desativação e métricas do admin global;
- bloqueio de desativar paróquia com sessão `OPEN`;
- paróquia inativa sem sessão nova, sem senha nova e sem estado público;
- entrar na fila, chamar em dois confessionários sem senha duplicada, atender, cancelar e esvaziar a fila;
- token inválido do sacerdote rejeitado.

Smoke manual de concorrência simultânea continua em `supabase/tests/queue_concurrency.sql`.

## Superfícies (checklist manual)

| Superfície | URL | Esperado |
| --- | --- | --- |
| Home | `/` | Institucional + CTA Administração. Sem cards de fiel/padre/TV. |
| Login secretaria | `/admin/login` | Destino `/admin`. |
| Login plataforma | `/admin/login` | Destino `/admin/global` se o usuário não tiver `church_admins`. |
| Fiel | `/s/{slug}` | Entra sem conta. |
| Sacerdote | `/padre/{id}?token=` | Só com `access_token` da mesa. |
| TV | `/tv/{slug}` | Estado público, sem tokens. |
| Secretaria | `/admin` | Só o tenant vinculado. |
| Plataforma | `/admin/global` | Lista, CRUD (desativar) e métricas agregadas. |

## Variáveis na Vercel

| Nome | Obrigatória | Origem |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | mesma tela (`anon` / `publishable`) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | mesma tela (`service_role`). Só server. |
| `NEXT_PUBLIC_APP_URL` | sim | URL canônica do app (ex.: `https://fila-confissao.vercel.app`) |

A integração Vercel↔Supabase também injeta `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. O app aceita esses nomes como fallback.

## Dashboard do Supabase hospedado (antes de abrir às paróquias)

1. Authentication → Providers → Email → desligar **Allow new users to sign up** (mantenha o provider Email ligado).
2. Authentication → URL Configuration:
   - **Site URL** = `NEXT_PUBLIC_APP_URL`
   - Redirect URLs: `https://<dominio>/**` e `http://localhost:3000/**` (dev).
3. Aplicar migrações: `npx supabase db push` no projeto linkado.
4. Criar o admin global:
   1. Authentication → Users → Add user (e-mail confirmado).
   2. SQL Editor:

```sql
insert into public.global_admins (user_id, role, is_active)
values ('AUTH_USER_UUID', 'owner', true);
```

O seed `global@plataforma.local` / `global123` existe só no Docker local.

## Admin local da primeira paróquia

1. Criar o usuário no Auth (mesmo fluxo, e-mail confirmado).
2. No painel `/admin/global/paroquias`, vincular o `user_id` à paróquia.
   Alternativa SQL: `select public.global_assign_church_admin('CHURCH_UUID', 'AUTH_USER_UUID');`

## Guardrails que a validação confirmou

- Fiel sem conta e sem PII; conteúdo de confissão nunca é armazenado.
- Concorrência da fila no PostgreSQL (`FOR UPDATE SKIP LOCKED`).
- Sem `select`/`update` direto de `tickets` no frontend da fila.
- Service role só no server.
- Paróquia desativada não abre sessão nova nem emite senha; histórico permanece.

## Pronto para Vercel

O app já está no modelo Vercel + projeto remoto. Depois do merge em `main`:

1. Conferir as quatro variáveis no projeto Vercel.
2. Conferir o checklist do dashboard acima.
3. Abrir `/`, `/admin/login` e uma sessão seed/real ponta a ponta.
