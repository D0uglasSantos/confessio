# MVP 01 — Backlog de implementação

Este backlog executa o plano de `mvp-01-profissional-multi-paroquia.md`.

Legenda:

- `[ ]` pendente
- `[~]` em andamento
- `[x]` concluído

## Fase 0 — Planejamento e alinhamento

- [x] Definir visão de produto do MVP profissional.
- [x] Definir escopo multi-paróquia com admin global.
- [x] Registrar guardrails de segurança e privacidade.
- [x] Criar documentação base em `docs/implementacoes`.

## Fase 1 — Fundação de dados e autorização global

- [x] Criar migration para `global_admins`.
- [x] Criar função `is_global_admin(required_role text default null)`.
- [x] Criar RPC `global_list_churches()`.
- [x] Criar RPC `global_create_church(name text, slug text, logo_url text)`.
- [x] Criar RPC `global_get_dashboard_metrics(p_from timestamptz, p_to timestamptz)`.
- [x] Criar RPC `global_assign_church_admin(p_church_id uuid, p_user_id uuid)`.
- [x] Criar RPC `global_update_church(...)` e `global_set_church_active(...)`.
- [x] Aplicar grants das novas RPCs.
- [x] Validar migration em ambiente local (`supabase start` + `db reset`) — 9 migrations aplicadas, inclusive `global_admin_foundation`, `global_admin_audit_log` e `church_lifecycle`. Seed com `admin@paroquia.local` e `global@plataforma.local`.
- [x] Atualizar `src/types/database.ts` após migrations.

Critério de aceite:

- Um usuário global autorizado consegue listar e cadastrar paróquias apenas por RPC.

## Fase 2 — Interface de admin global

- [x] Criar rota protegida `/admin/global`.
- [x] Adicionar navegação segura entre `/admin` e `/admin/global` (link só aparece para quem é admin global).
- [x] Implementar tabela/lista de paróquias com status de uso.
- [x] Implementar cards de métricas agregadas.
- [x] Implementar formulário de cadastro de nova paróquia.
- [x] Implementar ação de vínculo de admin local na paróquia.
- [x] Implementar edição de paróquia (nome, slug, logo).
- [x] Implementar desativação/reativação (sem exclusão física).

Critério de aceite:

- Fluxo mínimo: cadastrar paróquia e enxergar no dashboard global. **Atingido**. CRUD completo no sentido de Create / Read / Update / Deactivate. Delete físico fica fora do MVP (CASCADE apagaria sessões e tickets).

Notas de implementação:

- `src/lib/admin/global.ts`: `requireGlobalAdmin(minimumRole)` — autorização sempre validada via RPC `is_global_admin` no banco, nunca no cliente.
- `src/app/admin/global/page.tsx`, `src/app/admin/global/sem-permissao/page.tsx`, `src/app/admin/global/actions.ts`.
- `src/components/admin/global/*`: `global-metrics-grid`, `church-list`, `create-church-form`, `assign-church-admin-dialog`.
- Vínculo de admin local exige o `user_id` (auth.users.id) já existente — sem criação de usuário embutida neste MVP (ver `docs/DATABASE.md`, seção 24.1).

## Fase 3 — Profissionalização visual

- [x] Redesenhar `src/app/page.tsx` (home inicial) com tom institucional.
- [~] Revisar hierarquia visual do `/admin` local — mantida (já usava Cards/Badges consistentes); só foi adicionado o link contextual para `/admin/global`. Revisão mais profunda fica para quando houver feedback de uso real.
- [x] Padronizar estados `loading`, `empty`, `error`, `success` — já seguia um padrão consistente (Card + texto muted para empty, toast para success/error, texto de progresso nos botões); replicado nos novos componentes do admin global.
- [x] Revisar microcopy para comunicação objetiva e profissional — removida badge "Desenvolvimento" e nomenclatura de "demo" na home; mensagens de `sem-permissao` e `admin/error.tsx` reescritas sem jargão de nome de tabela.
- [x] Garantir responsividade por superfície (mobile/desktop/TV) — home nova testada em grid responsivo (1 coluna no mobile, 2–3 no desktop); demais superfícies não foram alteradas nesta fase.

Critério de aceite:

- Home e admin passam checklist visual de consistência e legibilidade. **Atingido para a home** (validado via build + screenshot). Admin local mantém o padrão anterior, já considerado adequado.

Notas de implementação:

- `src/app/page.tsx`: porta institucional. Sem cards de atalho para fiel/padre/TV. Sem service role e sem `access_token` na home.
- Fiel, padre e TV continuam nas rotas `/s`, `/padre` e `/tv`, chegando pelos QR/links da sessão.
- Login: secretaria → `/admin`; admin global sem paróquia → `/admin/global`.

## Fase 4 — Segurança e hardening

- [x] Revisar todas as rotas admin para proteção server-side.
- [x] Revisar RLS para evitar qualquer vazamento entre tenants.
- [x] Adicionar auditoria mínima para ações globais críticas.
- [x] Revisar tratamento de erro para evitar vazamento técnico.
- [x] Validar variáveis sensíveis e uso de service role apenas no server.

Critério de aceite:

- Checklist de segurança fechado sem bloqueadores críticos. **Atingido** (ver notas abaixo; um item depende de ação manual no dashboard hospedado antes do deploy).

Notas de implementação (auditoria feita nesta fase):

- **Rotas admin**: todas as páginas em `/admin/**` chamam `requireAdminChurch()` ou `requireGlobalAdmin()` e revalidam `church_id`/ownership manualmente além da RLS (defesa em profundidade). Middleware (`src/lib/supabase/proxy.ts`) bloqueia `/admin/**` sem sessão, exceto `login`, `esqueci-senha`, `redefinir-senha` e as páginas `sem-permissao` (que não expõem dado sensível). A nova rota `/admin/global/sem-permissao` fica protegida (não está na allowlist do middleware).
- **RLS entre tenants**: revisadas `churches`, `sessions`, `stations`, `tickets`, `station_access`, `ticket_tokens`, `church_admins`, `global_admins`, `platform_audit_log`. Tokens privados (`ticket_tokens.anonymous_token`, `station_access.access_token`) continuam sem grant direto para `anon`/`authenticated` — só saem via RPC `SECURITY DEFINER`. Nenhum caminho encontrado que vaze dado de uma paróquia para outra.
- **Auditoria mínima**: nova tabela `platform_audit_log` (`supabase/migrations/20260928120000_global_admin_audit_log.sql`) + função `private.log_platform_action(...)`. `global_create_church` e `global_assign_church_admin` registram ação, ator e metadata agregada (nunca dado de fiel). Exibido em `/admin/global` via `AuditLogList`.
- **Tratamento de erro**: `src/app/admin/actions.ts` tinha 7 pontos retornando `error.message`/`stationsError.message` crus do PostgREST direto pro usuário (potencial vazamento de detalhe técnico/nome de constraint). Todos passaram a usar `mapQueueError(...)`, que só retorna mensagens da allowlist e nunca o texto bruto do Postgres.
- **Variáveis sensíveis**: confirmado que `SUPABASE_SERVICE_ROLE_KEY` só é lido em `src/lib/supabase/admin.ts`, usado apenas por Server Components/Server Actions (nenhum arquivo com `"use client"` importa esse módulo). `.env.local`/`.env` seguem no `.gitignore` e nunca foram commitados (`git log` limpo).
- **Signup público desligado**: `supabase/config.toml` `[auth] enable_signup = false` (GoTrue `DISABLE_SIGNUP`). O provider de e-mail permanece ligado (`[auth.email] enable_signup = true`) para o login da secretaria. **Pendente ação manual no dashboard hospedado**: desligar só "Allow new users to sign up", sem desligar o provider Email. Ver `docs/DATABASE.md` §"Hardening de Auth (produção)".

- **Home pública**: a revisão pré-Fase 5 encontrou que `src/app/page.tsx` ainda usava service role para escolher uma sessão e publicava o `access_token` do padre. Isso viola o critério “nenhuma superfície pública expõe segredos”. Corrigido: a home passou a ser só institucional + CTA de login.
- **Login do admin global**: `signInAdminWithPassword` exigia `church_admins` e derrubava quem era só `global_admins`. Corrigido: aceita os dois papéis e redireciona para `/admin` ou `/admin/global`.

## Revisão pré-Fase 5

Decisão de produto (ver `mvp-01-profissional-multi-paroquia.md` §5.0):

- A paróquia **não** faz login para depois escolher fiel/padre/TV.
- Login é só da secretaria e da plataforma.
- Fiel, padre e TV entram pelos QR/links gerados no painel daquela sessão.
- Admin global faz Create / Read / Update / Deactivate de paróquias. Não apaga fisicamente.

## Fase 5 — Validação final de MVP

- [x] Executar regressão do fluxo fiel/padre/TV.
- [x] Executar regressão do fluxo admin local.
- [x] Validar fluxo admin global ponta a ponta.
- [x] Atualizar documentação final e checklist de entrega.
- [x] Preparar release para Vercel.

Critério de aceite:

- MVP apto para entrada das primeiras paróquias. **Atingido** após `npm run test:db`, build de produção e checklist em `mvp-01-entrega.md`.

Notas de implementação:

- Script executável: `supabase/tests/mvp_01_regression.sql` (`npm run test:db`). Cobre isolamento de tenant, RPCs globais, ciclo da fila e paróquia inativa.
- Achado da validação: paróquia `is_active = false` ainda podia ganhar sessão nova e senha. Corrigido em `20260928180000_inactive_church_guards.sql` (trigger no banco + bloqueio nas actions da secretaria).
- Entrega e Vercel: `docs/implementacoes/mvp-01-entrega.md`. CI de `lint`+`build` em `.github/workflows/ci.yml`.

## Riscos e mitigação

- Risco: mistura de permissão local e global.
  - Mitigação: funções de autorização separadas e testes de permissão.
- Risco: regressão no fluxo atual da fila.
  - Mitigação: regressão obrigatória por fase e backend-first.
- Risco: sobrecarga de escopo no primeiro MVP.
  - Mitigação: priorizar funcionalidades mínimas e adiar não objetivos.

## Ordem de implementação recomendada imediata

1. Fase 1 (schema + RPCs globais)
2. Fase 2 (painel global funcional)
3. Fase 3 (refino visual)
4. Fase 4/5 (hardening + validação final)
