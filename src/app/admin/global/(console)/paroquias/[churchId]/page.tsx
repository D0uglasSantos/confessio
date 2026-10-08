import Link from "next/link";
import { notFound } from "next/navigation";

import { AssignChurchAdminDialog } from "@/components/admin/global/assign-church-admin-dialog";
import { ChurchRowActions } from "@/components/admin/global/church-row-actions";
import { SendAdminResetButton } from "@/components/admin/global/send-admin-reset-button";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsRow } from "@/components/ui/stats-row";
import { formatAdminDate, formatAdminDateTime, formatCount, formatCounted } from "@/lib/admin/format";
import { requireGlobalAdmin } from "@/lib/admin/global";
import {
  parseChurchAdmins,
  parseChurchSessions,
  parseGlobalChurches,
} from "@/lib/admin/global-metrics";
import type { ParishSessionStatus } from "@/components/admin/parish/session-helpers";

export const dynamic = "force-dynamic";

export default async function AdminGlobalChurchPage({
  params,
}: {
  params: Promise<{ churchId: string }>;
}) {
  const { churchId } = await params;
  const { supabase } = await requireGlobalAdmin("viewer");

  const [
    { data: churchesRaw },
    { data: adminsRaw },
    { data: sessionsRaw },
  ] = await Promise.all([
    supabase.rpc("global_list_churches"),
    supabase.rpc("global_list_church_admins", { p_church_id: churchId }),
    supabase.rpc("global_list_church_sessions", { p_church_id: churchId }),
  ]);

  const church = parseGlobalChurches(churchesRaw).find((item) => item.id === churchId);
  if (!church) {
    notFound();
  }

  const admins = parseChurchAdmins(adminsRaw);
  const sessions = parseChurchSessions(sessionsRaw);

  return (
    <>
      <ConsolePageHeader
        title={church.name}
        description={`/${church.slug} · cadastrada em ${church.created_at ? formatAdminDate(church.created_at) : "—"}`}
        breadcrumb={[
          { href: "/admin/global/paroquias", label: "Paróquias" },
          { label: church.name },
        ]}
        actions={<ChurchRowActions church={church} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        {church.is_active ? (
          <Badge variant="success">Ativa</Badge>
        ) : (
          <Badge variant="outline">Desativada</Badge>
        )}
        <p className="text-muted-foreground text-sm">
          {church.sessions_open_now > 0
            ? formatCounted(church.sessions_open_now, {
                one: "sessão em operação agora",
                other: "sessões em operação agora",
              })
            : "Nenhuma fila aberta agora"}
        </p>
      </div>

      <StatsRow
        items={[
          {
            label: "Sessões",
            value: formatCount(church.sessions_total),
            hint: formatCounted(church.sessions_total, {
              one: "sessão criada",
              other: "sessões criadas",
            }),
            emphasize: true,
          },
          {
            label: "Admins",
            value: formatCount(admins.length),
            hint: formatCounted(admins.length, {
              one: "secretaria vinculada",
              other: "secretarias vinculadas",
            }),
          },
        ]}
      />

      <section className="grid items-start gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-heading text-xl">Secretarias</h2>
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum admin vinculado.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {admins.map((admin) => (
                <li
                  key={admin.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="truncate">{admin.email ?? admin.user_id}</span>
                  {admin.email ? (
                    <SendAdminResetButton email={admin.email} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <AssignChurchAdminDialog
            churchId={church.id}
            churchName={church.name}
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-xl">Sessões recentes</h2>
          {sessions.length === 0 ? (
            <EmptyState
              title="Nenhuma sessão"
              description="Nenhuma sessão criada nesta paróquia."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {sessions.slice(0, 12).map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{session.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {session.starts_at
                        ? formatAdminDateTime(session.starts_at)
                        : "Sem horário"}
                    </p>
                  </div>
                  <SessionStatusBadge
                    status={session.status as ParishSessionStatus}
                  />
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/global/paroquias"
            className="text-muted-foreground hover:text-foreground inline-block text-sm underline-offset-4 hover:underline"
          >
            Voltar às paróquias
          </Link>
        </div>
      </section>
    </>
  );
}
