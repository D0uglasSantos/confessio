import type { Database } from "@/types/database";

type SessionStatus = Database["public"]["Enums"]["session_status"];
type StationStatus = Database["public"]["Enums"]["station_status"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export const sessionStatusLabel: Record<SessionStatus, string> = {
  DRAFT: "Rascunho",
  OPEN: "Fila aberta",
  ENTRY_CLOSED: "Entrada encerrada",
  FINISHED: "Encerrada",
  CANCELLED: "Cancelada",
};

export const stationStatusLabel: Record<StationStatus, string> = {
  OFFLINE: "Offline",
  AVAILABLE: "Disponível",
  CALLING: "Chamando",
  BUSY: "Em atendimento",
  PAUSED: "Pausado",
};

export const ticketStatusLabel: Record<TicketStatus, string> = {
  WAITING: "Aguardando",
  CALLED: "Chamado",
  IN_SERVICE: "Em atendimento",
  COMPLETED: "Concluído",
  NO_SHOW: "Não compareceu",
  CANCELLED: "Cancelado",
};

export function generateSessionSlug(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let slug = "";

  for (let index = 0; index < length; index += 1) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return slug;
}
