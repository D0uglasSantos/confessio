# UI e superfícies

| Rota | Superfície | Layout |
|------|------------|--------|
| `/s/[slug]` | Entrada do fiel | Mobile-first |
| `/s/[slug]/minha-senha` | Acompanhamento do fiel | Mobile-first |
| `/padre/[stationId]` | Painel do sacerdote | Mobile-first |
| `/tv/[sessionSlug]` | Telão | Landscape, tipografia em `vw`/`vmin` (1080p+) |
| `/admin` e `/admin/sessoes/[sessionId]` | Secretaria | Desktop-first |

Fiel e padre: safe areas, botões grandes, tipografia fluida.

## Concorrência no cliente

- Debounce ~200ms e sequência de refetch (ignorar respostas stale).
- Refetch ao reconnect (`SUBSCRIBED`).
- Lock síncrono anti double-tap em entrar na fila, ações do padre, cancelar e admin.
- Confirmar no-show e finalizar atendimento.
- Erros via mapper em `src/lib/queue/errors.ts`.
- PWA: service worker só em produção; cache mínimo do shell. A fila continua online via Supabase.
