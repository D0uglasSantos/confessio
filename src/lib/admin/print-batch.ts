export type PrintBatchTicket = {
  publicCode: string;
  publicNumber: number;
  token: string;
};

export type PrintBatch = {
  batchId: string;
  sessionId: string;
  sessionName: string;
  sessionSlug: string;
  churchName: string;
  ticketCount: number;
  firstPublicNumber: number;
  lastPublicNumber: number;
  tickets: PrintBatchTicket[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function parsePrintBatch(value: unknown): PrintBatch | null {
  const data = asRecord(value);
  if (!data) return null;

  const ticketsRaw = Array.isArray(data.tickets) ? data.tickets : [];
  const tickets: PrintBatchTicket[] = [];

  for (const item of ticketsRaw) {
    const ticket = asRecord(item);
    if (!ticket) continue;

    const publicCode =
      typeof ticket.public_code === "string" ? ticket.public_code : null;
    const publicNumber =
      typeof ticket.public_number === "number" ? ticket.public_number : null;
    const token = typeof ticket.token === "string" ? ticket.token : null;

    if (!publicCode || publicNumber == null || !token) continue;
    tickets.push({ publicCode, publicNumber, token });
  }

  if (
    typeof data.batch_id !== "string" ||
    typeof data.session_id !== "string" ||
    typeof data.session_name !== "string" ||
    typeof data.session_slug !== "string"
  ) {
    return null;
  }

  return {
    batchId: data.batch_id,
    sessionId: data.session_id,
    sessionName: data.session_name,
    sessionSlug: data.session_slug,
    churchName: typeof data.church_name === "string" ? data.church_name : "",
    ticketCount: Number(data.ticket_count ?? tickets.length),
    firstPublicNumber: Number(data.first_public_number ?? 0),
    lastPublicNumber: Number(data.last_public_number ?? 0),
    tickets,
  };
}