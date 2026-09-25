# Privacidade e credenciais

O fiel é anônimo. `public_code` é público; tokens são privados.

## Nunca armazenar

Nome, CPF, telefone, e-mail, pecados, motivo da confissão, anotações do sacerdote, conteúdo da conversa ou histórico espiritual.

## Tokens

- `anonymous_token` — credencial do ticket do fiel. Só no navegador dele. Nunca no Realtime nem em payload público.
- `access_token` — credencial do confessionário. Fora do Realtime.
- Nunca autorizar operação com `publicCode` vindo do cliente.
- Tokens ficam em tabelas separadas, com unicidade no banco.

## Frontend público

- Não fazer `select` direto em `tickets`.
- Não fazer `update` direto em ticket. Sempre RPC (`create_ticket`, `cancel_ticket`, `get_ticket_by_token`, etc.).
- `SUPABASE_SERVICE_ROLE_KEY` só no server. Nunca em Client Component, nunca `NEXT_PUBLIC_*`, nunca no navegador.
