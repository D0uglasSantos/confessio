import Link from "next/link";
import { notFound } from "next/navigation";

import { AssignChurchAdminDialog } from "@/components/admin/global/assign-church-admin-dialog";
import { ChurchRowActions } from "@/components/admin/global/church-row-actions";
import { SendAdminResetButton } from "@/components/admin/global/send-admin-reset-button";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAdminDate, formatAdminDateTime, formatCounted } from "@/lib/admin/format";
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
        actions={<ChurchRowActions church={church} />}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {church.is_active ? <Badge>Ativa</Badge> : <Badge variant="outline">Desativada</Badge>}
            <p className="text-muted-foreground text-sm">
              {church.sessions_open_now > 0
                ? formatCounted(church.sessions_open_now, {
                    one: "sessão em operação agora",
                    other: "sessões em operação agora",
                  })
                : "Nenhuma fila aberta agora"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl tabular-nums">
              {church.sessions_total}
            </p>
            <p className="text-muted-foreground text-sm">
              {formatCounted(church.sessions_total, {
                one: "sessão criada",
                other: "sessões criadas",
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
            <CardDescription>
              {formatCounted(admins.length, {
                one: "secretaria vinculada",
                other: "secretarias vinculadas",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {admins.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum admin vinculado.</p>
            ) : (
              <ul className="space-y-2">
                {admins.map((admin) => (
                  <li
                    key={admin.user_id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
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
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Sessões recentes</CardTitle>
          <CardDescription>
            Visão da plataforma, sem dados de fiéis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma sessão criada nesta paróquia.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 12).map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
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
            className="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline-offset-4 hover:underline"
          >
            Voltar às paróquias
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
