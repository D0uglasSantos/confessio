import type { Database } from "@/types/database";

export type SessionStatus = Database["public"]["Enums"]["session_status"];
export type StationStatus = Database["public"]["Enums"]["station_status"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export type SessionMetrics = {
  total: number;
  waiting: number;
  called: number;
  in_service: number;
  completed: number;
  no_show: number;
  cancelled: number;
  active_stations: number;
  average_service_minutes: number | null;
  average_wait_minutes: number | null;
};

export type AdminSessionTicket = {
  id: string;
  public_number: number;
  public_code: string;
  status: TicketStatus;
  station_id: string | null;
  created_at: string;
  called_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  no_show_at: string | null;
  cancelled_at: string | null;
  recall_count: number;
};

export type AdminSessionState = {
  session: {
    id: string;
    name: string;
    slug: string;
    status: SessionStatus;
    starts_at: string | null;
    ends_at: string | null;
    show_waiting_queue_on_tv: boolean;
    ticket_prefix: string;
  };
  metrics: SessionMetrics;
  stations: Array<{
    id: string;
    name: string;
    priest_name: string | null;
    status: StationStatus;
  }>;
  tickets: AdminSessionTicket[];
};

export function parseAdminSessionState(
  value: unknown,
): AdminSessionState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as AdminSessionState;

  if (!data.session?.id || !data.metrics) {
    return null;
  }

  return {
    session: data.session,
    metrics: {
      total: Number(data.metrics.total ?? 0),
      waiting: Number(data.metrics.waiting ?? 0),
      called: Number(data.metrics.called ?? 0),
      in_service: Number(data.metrics.in_service ?? 0),
      completed: Number(data.metrics.completed ?? 0),
      no_show: Number(data.metrics.no_show ?? 0),
      cancelled: Number(data.metrics.cancelled ?? 0),
      active_stations: Number(data.metrics.active_stations ?? 0),
      average_service_minutes:
        data.metrics.average_service_minutes == null
          ? null
          : Number(data.metrics.average_service_minutes),
      average_wait_minutes:
        data.metrics.average_wait_minutes == null
          ? null
          : Number(data.metrics.average_wait_minutes),
    },
    stations: Array.isArray(data.stations) ? data.stations : [],
    tickets: Array.isArray(data.tickets) ? data.tickets : [],
  };
}

export function formatMinutes(value: number | null) {
  if (value == null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} min`;
}
