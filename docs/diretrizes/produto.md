# Produto

**Confessio** — Acolhimento e organização para paróquias.

O sistema organiza **fila, senhas e confessionários** em sessões de confissão. Ele administra só o fluxo de atendimento.

## Obrigatório

- Fiel **sem conta**. Não pedir nome, CPF ou e-mail. Telefone é opcional, só para aviso de chamada no WhatsApp.
- Uma **única fila por sessão**. O fiel não escolhe o sacerdote.
- Quando chega o horário de fim do agendamento (`ends_at`), ninguém mais entra na fila. Quem já está na fila continua até ser atendido ou o admin finalizar a sessão.
- Múltiplos confessionários podem chamar ao mesmo tempo, sem senha duplicada.
- Acompanhar chamada em tempo real (fiel, padre e TV).
- Auth existe **somente** para `/admin`.

## Nunca

- Armazenar conteúdo da confissão, pecados, motivo, anotações ou histórico espiritual.
- Identificar o penitente.
- Resolver no cliente quem é o próximo da fila.
