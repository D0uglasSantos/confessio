import type { Database } from "@/types/database";

export type SessionStatus = Database["public"]["Enums"]["session_status"];
export type StationStatus = Database["public"]["Enums"]["station_status"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export type FielTicket = Database["public"]["CompositeTypes"]["fiel_ticket"];

export type PublicStationState = {
  id: string;
  name: string;
  priest_name: string | null;
  status: StationStatus;
  current_public_code: string | null;
};

export type PublicSessionState = {
  session: {
    id: string;
    name: string;
    slug: string;
    status: SessionStatus;
    show_waiting_queue_on_tv: boolean;
    church_name: string;
  };
  stations: PublicStationState[];
  waiting_count: number;
  waiting_codes: string[];
};

export type StationCurrentTicket = {
  id: string;
  public_code: string;
  public_number: number;
  status: TicketStatus;
  called_at: string | null;
  last_recalled_at: string | null;
  started_at: string | null;
  recall_count: number;
};

export type StationState = {
  session: {
    id: string;
    name: string;
    slug: string;
    status: SessionStatus;
  };
  station: {
    id: string;
    name: string;
    priest_name: string | null;
    status: StationStatus;
  };
  waiting_count: number;
  current_ticket: StationCurrentTicket | null;
};

export function parseStationState(value: unknown): StationState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as StationState;

  if (!data.session?.id || !data.station?.id || !data.station?.status) {
    return null;
  }

  return {
    session: data.session,
    station: data.station,
    waiting_count: Number(data.waiting_count ?? 0),
    current_ticket: data.current_ticket ?? null,
  };
}

export function parsePublicSessionState(value: unknown): PublicSessionState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as PublicSessionState;

  if (!data.session?.id || !data.session?.slug || !data.session?.status) {
    return null;
  }

  return {
    session: data.session,
    stations: Array.isArray(data.stations) ? data.stations : [],
    waiting_count: Number(data.waiting_count ?? 0),
    waiting_codes: Array.isArray(data.waiting_codes) ? data.waiting_codes : [],
  };
}

export function countActiveStations(stations: PublicStationState[]) {
  return stations.filter((station) =>
    ["AVAILABLE", "CALLING", "BUSY"].includes(station.status),
  ).length;
}

export function deriveFaithfulView(status: TicketStatus | null | undefined, peopleAhead: number) {
  if (!status) return "LOADING" as const;
  if (status === "WAITING" && peopleAhead === 0) return "NEXT" as const;
  if (status === "WAITING" && peopleAhead > 0 && peopleAhead <= 2) return "NEAR" as const;
  return status;
}
