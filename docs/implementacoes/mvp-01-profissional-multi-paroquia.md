# MVP 01 — Profissional + Multi-paróquia + Admin Global

Status: planejamento aprovado para início de implementação incremental.

## 1) Objetivo do ciclo

Sair da fase inicial de desenvolvimento e chegar no primeiro MVP operacional com:

- aparência mais profissional na experiência inicial;
- segurança geral reforçada;
- suporte de produto para várias paróquias usando o mesmo sistema;
- visão de administração global para governança da plataforma.

O fluxo principal da fila de confissão permanece igual (fiel, padre, TV e atendimento).

## 2) Escopo funcional

### 2.1 Mantém como está (sem redesign de lógica)

- fluxo do fiel na fila;
- fluxo do padre/confessionário;
- painel TV/telão;
- regras de chamada e concorrência no banco via RPC.

### 2.2 Evolui neste ciclo

- home inicial com posicionamento mais profissional;
- camada de segurança (app, auth, permissões, operação);
- arquitetura multi-paróquia com isolamento de dados;
- novo módulo de admin global.

## 3) Personas administrativas

- Admin de Paróquia: opera sessões, confessionários e métricas da sua própria paróquia.
- Admin Global (plataforma): cadastra paróquias, gerencia acessos e acompanha métricas do sistema inteiro.

## 4) Arquitetura alvo (alto nível)

## 4.1 Multi-tenant por paróquia

- Tenant lógico = paróquia (`church_id`).
- Isolamento por RLS obrigatório em tudo que é dado interno.
- Toda query administrativa deve carregar escopo de tenant no banco.

## 4.2 Dois níveis de administração

- Nível local: `church_admins` (já existente) para gestão por paróquia.
- Nível global: novo mecanismo de autorização para usuários plataforma.

Decisão recomendada para MVP:

- criar tabela `global_admins` com `user_id`, `role`, `is_active`, `created_at`;
- roles iniciais: `owner`, `operator`, `viewer`.

## 4.3 Princípio de segurança

- Regras críticas continuam no PostgreSQL/RPC.
- Frontend nunca vira autoridade.
- Segredos continuam server-side.

## 5) Fluxo alvo de administração

## 5.0 Quem entra por onde (decisão permanente)

A home **não** é um lançador das quatro superfícies. Ela é a porta institucional da plataforma.

| Pessoa | Login | Como chega | Para onde vai |
|--------|-------|------------|---------------|
| Fiel | Nunca | QR / URL da sessão da paróquia (`/s/{slug}`) | Fila anônima |
| Sacerdote | Nunca | QR da mesa (`/padre/{stationId}?token=...`) | Painel do confessionário |
| Telão | Nunca | Link aberto pela secretaria (`/tv/{slug}`) | TV daquela sessão |
| Secretaria da paróquia | E-mail + senha | Home → Entrar na administração | `/admin` da **sua** paróquia |
| Admin da plataforma | E-mail + senha | Home → Entrar na administração | `/admin/global` |

O login **não** abre fiel, padre ou TV. Depois de autenticada, a secretaria gera os QR Codes e os links operacionais daquela sessão. Cada paróquia só vê o próprio tenant.

A home pública **nunca** escolhe “uma sessão qualquer” nem publica `access_token` de confessionário.

## 5.1 Admin de paróquia (`/admin`)

Sem quebra do fluxo atual, com melhoria visual e organização:

- dashboard com sessões recentes e métricas do dia;
- criar sessão, abrir/encerrar fila, impressão e operação normal;
- visibilidade de saúde operacional da paróquia.

## 5.2 Admin global (`/admin/global`)

Novo módulo com:

- lista de paróquias cadastradas;
- cadastro, edição e desativação de paróquia (sem exclusão física no MVP);
- status de uso (com sessão ativa ou não);
- métricas agregadas do sistema;
- gestão de vínculo de admins locais por paróquia.

Exclusão física de paróquia (CASCADE em sessões e tickets) fica fora deste ciclo: desativar preserva o histórico operacional e impede operação nova.

## 6) Diretrizes de UX para “cara profissional”

- linguagem visual consistente com design system (tipografia, spacing, contraste e estados);
- página inicial orientada por “produto em produção”, sem rótulo de ambiente inicial;
- textos institucionais na home; fiel, padre e TV **não** são atalhos públicos da raiz;
- dashboards com blocos objetivos de status, ação rápida e métricas;
- feedbacks explícitos de carregamento, sucesso e erro em ações críticas.

## 7) Baseline de segurança para MVP

## 7.1 App e autenticação

- reforçar proteção de rotas administrativas no server;
- hardening de sessão (expiração, refresh e fallback seguro);
- rate limit em endpoints administrativos sensíveis;
- padronização de erros sem vazamento técnico.

## 7.2 Banco e autorização

- revisar RLS para garantir isolamento entre paróquias;
- criar policies exclusivas para `global_admins`;
- RPCs administrativas globais com `security definer` e validação explícita de role.

## 7.3 Operação

- trilha de auditoria mínima para ações de alto impacto:
  - criar paróquia;
  - vincular/remover admin local;
  - alterar status de paróquia.

## 8) Métricas para admin global

Métricas mínimas do dashboard global:

- total de paróquias cadastradas;
- paróquias com sessão ativa agora;
- sessões abertas no período;
- tickets emitidos no período;
- taxa de no-show agregada;
- tempo médio de atendimento agregado.

Observação:

- métricas são operacionais e agregadas, sem qualquer informação de confissão.

## 9) Roadmap técnico por fases

## Fase 1 — Fundação do admin global (backend primeiro)

- modelagem `global_admins`;
- novas RPCs globais:
  - `global_list_churches`
  - `global_create_church`
  - `global_get_dashboard_metrics`
  - `global_assign_church_admin`
- políticas RLS e grants.

Saída esperada: backend seguro pronto para UI.

## Fase 2 — UI de admin global

- rota protegida `/admin/global`;
- listagem e cadastro de paróquias;
- cards de métricas agregadas;
- ações de gestão de acesso local.

Saída esperada: operação básica multi-paróquia via painel global.

## Fase 3 — Upgrade visual do produto

- redesign da home inicial;
- refinamento visual do `/admin` local;
- padrões de feedback (loading/empty/error/success).

Saída esperada: percepção profissional consistente.

## Fase 4 — Hardening final do MVP

- checklist de segurança e autorização;
- testes de regressão de fluxo de fila;
- revisão de logs e auditoria;
- ajustes finais para deploy em Vercel.

Saída esperada: MVP pronto para primeiras paróquias reais.

## 10) Critérios de aceite do ciclo

- admin global consegue cadastrar uma nova paróquia de ponta a ponta;
- admin global consegue associar admin local à paróquia;
- admin local enxerga apenas seu tenant;
- nenhuma superfície pública expõe dados privados ou segredos;
- fluxo atual da fila permanece funcionando sem regressões.

## 11) Não objetivos deste ciclo

- billing, cobrança ou plano SaaS;
- app mobile nativo;
- customizações avançadas por paróquia (tema completo, white-label profundo);
- integração com sistemas externos de gestão paroquial.

## 12) Decisões guardrails (não desviar)

- não mover concorrência para frontend;
- não abrir acesso direto público às tabelas de tickets;
- não armazenar PII do fiel;
- não misturar autorização global e local sem papel explícito.

## 13) Entregáveis de documentação obrigatórios

Durante a implementação, manter atualizados:

- este documento (visão e decisões);
- `mvp-01-backlog.md` (status por fase);
- `docs/DATABASE.md` (quando houver mudança de schema/RPC);
- `docs/diretrizes/*` (somente se regra estrutural mudar).
