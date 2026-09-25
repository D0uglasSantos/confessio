# Git — branches e commits

Padrão oficial a partir desta documentação. Aliases antigos (`ft/`, `bg/`, `bug/`, `rt/`) existem no histórico e **não devem ser usados em branches novas**.

## Branches

Formato:

```
tipo/descricao-em-kebab-case
```

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `feat/` | Funcionalidade nova | `feat/project-documentation` |
| `fix/` | Correção | `fix/session-expired-login-modal` |
| `chore/` | CI, deps, tarefas sem produto | `chore/rotate-workflow-concurrency` |
| `refactor/` | Mudança interna sem feature | `refactor/auth-session` |
| `docs/` | Só documentação | `docs/api-contract` |

Regras:

- Um assunto por branch; descrição curta em **kebab-case**.
- Preferir inglês (`feat/campaign-source-display`, não `feat/criar-fluxo-cupom`).
- Não usar underscore (`ajuste_build`) nem misturar prefixos (`feat/fix-...`).
- Basear o trabalho em `main` atualizado.

Aliases legados (somente leitura histórica):

- `ft/` → use `feat/`
- `bg/` e `bug/` → use `fix/`
- `rt/` → use `refactor/`

## Commits

Formato **obrigatório** (gitmoji + Conventional Commits **com scope** + inglês):

```
:gitmoji:tipo(scope): summary in English
```

O histórico já misturava estilos. O que passa a ser obrigatório: **gitmoji**, **scope** e mensagem **sempre em inglês**.

### Gitmoji e tipo

| Tipo | Gitmoji | Uso |
|------|---------|-----|
| `feat` | `:sparkles:` | Feature |
| `fix` | `:bug:` | Bug |
| `chore` | `:wrench:` | CI, config, manutenção |
| `refactor` | `:recycle:` | Refatoração |
| `docs` | `:memo:` | Documentação |

### Scope

Obrigatório, kebab-case, alinhado ao módulo tocado. Scopes usuais:

`docs`, `queue`, `admin`, `auth`, `priest`, `tv`, `print`, `pwa`, `supabase`, `realtime`, `layout`, `ci`

Se a mudança atravessa vários módulos, use o módulo principal — não omita o scope e não coloque lista (`feat(queue,admin)`).

### Summary

- Inglês, modo imperativo: `add`, `fix`, `update`, `remove`
- Sem ponto final
- Descreve o **porquê/resultado**, não o dump de arquivos
- Uma linha; corpo opcional só se o “porquê” não couber no título

### Exemplos

```
:sparkles:feat(docs): add project documentation, guidelines and Cursor rules
:sparkles:feat(queue): add anti double-tap lock on join and priest actions
:bug:fix(auth): reopen admin login after session expires
:wrench:chore(ci): harden deploy workflow concurrency
:memo:docs(git): clarify required commit scope
```

### Errado

```
feat: add docs
:sparkles:feat: add payment callback
Adiciona documentação
fix/adjust-texts
```

Commits de merge gerados pelo GitHub (`Merge pull request #N from …`) permanecem como o GitHub cria. Commits feitos à mão neste repositório seguem o formato acima.
