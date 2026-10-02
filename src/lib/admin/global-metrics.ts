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
  admin_emails: string[];
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
      admin_emails: Array.isArray(church.admin_emails)
        ? church.admin_emails.filter((email): email is string => typeof email === "string")
        : [],
    };
  });
}

export type AuditLogEntry = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: unknown;
  created_at: string;
  actor_email: string | null;
};

export type ChurchAdminSummary = {
  user_id: string;
  email: string | null;
  created_at: string;
};

export function parseAuditLog(value: unknown): AuditLogEntry[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const data = value as { entries?: unknown };
  if (!Array.isArray(data.entries)) {
    return [];
  }

  return data.entries.map((item) => {
    const entry = item as Partial<AuditLogEntry>;
    return {
      id: String(entry.id ?? ""),
      action: String(entry.action ?? ""),
      target_type: String(entry.target_type ?? ""),
      target_id: entry.target_id ? String(entry.target_id) : null,
      metadata: entry.metadata ?? {},
      created_at: String(entry.created_at ?? ""),
      actor_email:
        typeof entry.actor_email === "string" ? entry.actor_email : null,
    };
  });
}

export function parseChurchAdmins(value: unknown): ChurchAdminSummary[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const data = value as { admins?: unknown };
  if (!Array.isArray(data.admins)) {
    return [];
  }

  return data.admins.map((item) => {
    const admin = item as Partial<ChurchAdminSummary>;
    return {
      user_id: String(admin.user_id ?? ""),
      email: typeof admin.email === "string" ? admin.email : null,
      created_at: String(admin.created_at ?? ""),
    };
  });
}

export type ChurchSessionSummary = {
  id: string;
  name: string;
  status: string;
  starts_at: string | null;
};

export function parseChurchSessions(value: unknown): ChurchSessionSummary[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const data = value as { sessions?: unknown };
  if (!Array.isArray(data.sessions)) {
    return [];
  }

  return data.sessions.map((item) => {
    const session = item as Partial<ChurchSessionSummary>;
    return {
      id: String(session.id ?? ""),
      name: String(session.name ?? ""),
      status: String(session.status ?? ""),
      starts_at: session.starts_at ? String(session.starts_at) : null,
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
