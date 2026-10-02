import type { Database } from "@/types/database";

export type ParishSessionStatus = Database["public"]["Enums"]["session_status"];

export type ParishSessionSummary = {
  id: string;
  name: string;
  slug: string;
  status: ParishSessionStatus;
  starts_at: string | null;
  created_at: string;
  ends_at?: string | null;
  entry_opened_at?: string | null;
  finished_at?: string | null;
  tickets_issued?: number;
  tickets_completed?: number;
};

export type SessionDirectoryFilter =
  "all" | "operacao" | "rascunho" | "encerrada" | "cancelada";

export const sessionDirectoryFilters: Array<{
  id: SessionDirectoryFilter;
  label: string;
}> = [
  { id: "all", label: "Todas" },
  { id: "operacao", label: "Em operação" },
  { id: "rascunho", label: "Rascunho" },
  { id: "encerrada", label: "Encerrada" },
  { id: "cancelada", label: "Cancelada" },
];

export function parseSessionDirectoryFilter(
  value: string | null,
): SessionDirectoryFilter {
  if (
    value === "operacao" ||
    value === "rascunho" ||
    value === "encerrada" ||
    value === "cancelada"
  ) {
    return value;
  }

  return "all";
}

export function isSessionLive(status: ParishSessionStatus) {
  return status === "OPEN" || status === "ENTRY_CLOSED";
}

export function matchesSessionFilter(
  session: ParishSessionSummary,
  filter: SessionDirectoryFilter,
) {
  switch (filter) {
    case "operacao":
      return isSessionLive(session.status);
    case "rascunho":
      return session.status === "DRAFT";
    case "encerrada":
      return session.status === "FINISHED";
    case "cancelada":
      return session.status === "CANCELLED";
    default:
      return true;
  }
}

export function countSessionsByFilter(
  sessions: ParishSessionSummary[],
  filter: SessionDirectoryFilter,
) {
  if (filter === "all") {
    return sessions.length;
  }

  return sessions.filter((session) => matchesSessionFilter(session, filter))
    .length;
}

export function getParishSessionStats(sessions: ParishSessionSummary[]) {
  return {
    live: sessions.filter((session) => isSessionLive(session.status)),
    drafts: sessions.filter((session) => session.status === "DRAFT"),
    finished: sessions.filter((session) => session.status === "FINISHED"),
    total: sessions.length,
  };
}
