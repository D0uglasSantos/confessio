export type GlobalChurchSummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  admins_count: number;
  sessions_total: number;
  sessions_open_now: number;
};

export type GlobalDashboardMetrics = {
  period: { from: string; to: string };
  churches_total: number;
  churches_with_active_session: number;
  sessions_opened_in_period: number;
  tickets_created_in_period: number;
  no_show_rate_percent: number;
  average_service_minutes: number | null;
};

export function parseGlobalChurches(value: unknown): GlobalChurchSummary[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const data = value as { churches?: unknown };

  if (!Array.isArray(data.churches)) {
    return [];
  }

  return data.churches.map((item) => {
    const church = item as Partial<GlobalChurchSummary>;
    return {
      id: String(church.id ?? ""),
      name: String(church.name ?? ""),
      slug: String(church.slug ?? ""),
      logo_url: church.logo_url ?? null,
      is_active: church.is_active !== false,
      created_at: String(church.created_at ?? ""),
      admins_count: Number(church.admins_count ?? 0),
      sessions_total: Number(church.sessions_total ?? 0),
      sessions_open_now: Number(church.sessions_open_now ?? 0),
    };
  });
}

export function parseGlobalDashboardMetrics(
  value: unknown,
): GlobalDashboardMetrics | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<GlobalDashboardMetrics>;

  return {
    period: {
      from: String(data.period?.from ?? ""),
      to: String(data.period?.to ?? ""),
    },
    churches_total: Number(data.churches_total ?? 0),
    churches_with_active_session: Number(
      data.churches_with_active_session ?? 0,
    ),
    sessions_opened_in_period: Number(data.sessions_opened_in_period ?? 0),
    tickets_created_in_period: Number(data.tickets_created_in_period ?? 0),
    no_show_rate_percent: Number(data.no_show_rate_percent ?? 0),
    average_service_minutes:
      data.average_service_minutes == null
        ? null
        : Number(data.average_service_minutes),
  };
}
