const QUEUE_ERROR_MESSAGES: Array<[needle: string, message: string]> = [
  ["STATION_UNAUTHORIZED", "Link inválido. Peça um novo link no admin."],
  ["STATION_NOT_AVAILABLE", "O confessionário precisa estar disponível."],
  ["STATION_NOT_PAUSED", "O confessionário não está pausado."],
  ["QUEUE_EMPTY", "Não há ninguém aguardando na fila."],
  ["TICKET_NOT_CALLABLE", "Esta senha não pode ser chamada novamente."],
  ["TICKET_NOT_CALLED", "A senha precisa estar chamada."],
  ["TICKET_NOT_IN_SERVICE", "Não há atendimento em andamento."],
  ["TICKET_NOT_WAITING", "Só é possível sair enquanto estiver aguardando."],
  ["TICKET_NOT_FOUND", "Senha não encontrada."],
  ["SESSION_NOT_OPEN", "A entrada na fila não está aberta no momento."],
  ["SESSION_NOT_FOUND", "Sessão não encontrada."],
  ["INVALID_PAPER_TICKET_COUNT", "Escolha um lote de 50 a 500, de 50 em 50."],
  ["PRINT_BATCH_NOT_FOUND", "Lote de impressão não encontrado."],
  ["SESSION_NOT_DRAFT", "A sessão já foi aberta."],
  ["FORBIDDEN", "Você não tem permissão para esta ação."],
];

export function mapQueueError(
  message: string | undefined,
  fallback = "Não foi possível concluir a ação.",
) {
  if (!message) return fallback;

  for (const [needle, friendly] of QUEUE_ERROR_MESSAGES) {
    if (message.includes(needle)) {
      return friendly;
    }
  }

  // Evita vazar detalhes internos do Postgres/PostgREST.
  if (/P000|42501|22P02|violates|permission denied/i.test(message)) {
    return fallback;
  }

  return fallback;
}
