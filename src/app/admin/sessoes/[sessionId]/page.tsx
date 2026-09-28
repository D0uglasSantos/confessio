import Link from "next/link";
import { notFound } from "next/navigation";

import { AddStationForm } from "@/components/admin/add-station-form";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { formatAdminDayTime, formatAdminTime } from "@/lib/admin/format";
import { AdminSessionRealtime } from "@/components/admin/admin-session-realtime";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { PrintTicketBatchForm } from "@/components/admin/print-ticket-batch-form";
import { QrCodeCard } from "@/components/admin/qr-code-card";
import { SessionLifecycleActions } from "@/components/admin/session-lifecycle-actions";
import { SessionMetricsGrid } from "@/components/admin/session-metrics-grid";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminChurch } from "@/lib/admin/church";
import { stationStatusLabel, ticketStatusLabel } from "@/lib/admin/labels";
import { parseAdminSessionState } from "@/lib/admin/metrics";
import { stationAccessToken } from "@/lib/admin/station-access";
import {
  sessionPublicUrl,
  sessionTvUrl,
  stationPriestUrl,
} from "@/lib/app-url";

type AdminSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminSessionPage({
  params,
}: AdminSessionPageProps) {
  const { sessionId } = await params;
  const { supabase, church, user } = await requireAdminChurch();

  const [{ data: session }, { data: isGlobalAdmin }] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, name, slug, status, ticket_prefix, starts_at, show_waiting_queue_on_tv, church_id",
      )
      .eq("id", sessionId)
      .maybeSingle(),
    supabase.rpc("is_global_admin", { p_required_role: "viewer" }),
  ]);

  if (!session || session.church_id !== church.id) {
    notFound();
  }

  const [{ data: stations }, { data: adminStateRaw }, { data: printBatches }] =
    await Promise.all([
      supabase
        .from("stations")
        .select("id, name, priest_name, status, station_access(access_token)")
        .eq("session_id", sessionId)
        .order("name"),
      supabase.rpc("admin_get_session_state", { p_session_id: sessionId }),
      supabase
        .from("paper_print_batches")
        .select(
          "id, ticket_count, first_public_number, last_public_number, created_at",
        )
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false }),
    ]);

  const adminState = parseAdminSessionState(adminStateRaw);
  const metrics = adminState?.metrics ?? {
    total: 0,
    waiting: 0,
    called: 0,
    in_service: 0,
    completed: 0,
    no_show: 0,
    cancelled: 0,
    active_stations: 0,
    average_service_minutes: null,
    average_wait_minutes: null,
  };
  const tickets = adminState?.tickets ?? [];

  const publicUrl = sessionPublicUrl(session.slug);
  const tvUrl = sessionTvUrl(session.slug);
  const hasPrintableStations = (stations ?? []).some((station) =>
    stationAccessToken(station.station_access),
  );

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <AdminSessionRealtime sessionId={session.id} />

      <ConsolePageHeader
        title={session.name}
        description={`Prefixo ${session.ticket_prefix} · /s/${session.slug}${
          session.starts_at ? ` · ${formatAdminDayTime(session.starts_at)}` : ""
        }`}
        actions={<SessionStatusBadge status={session.status} />}
      />

      <SessionMetricsGrid metrics={metrics} />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operação</CardTitle>
            <CardDescription>
              Abra a fila quando os sacerdotes estiverem prontos. Encerrar a
              entrada impede novas senhas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SessionLifecycleActions
              sessionId={session.id}
              status={session.status}
              showWaitingQueueOnTv={session.show_waiting_queue_on_tv}
            />
            <div className="border-t pt-5">
              <h3 className="mb-1 font-medium">Senhas de papel</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Ao abrir a fila, imprima o lote. Quem tiver celular escaneia o
                QR do papel ou o da TV.
              </p>
              <PrintTicketBatchForm
                sessionId={session.id}
                ticketPrefix={session.ticket_prefix}
                disabled={session.status !== "OPEN"}
                batches={printBatches ?? []}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code e links</CardTitle>
            <CardDescription>
              Cartaz e TV usam o QR da sessão. O papel impresso tem um QR
              próprio, ligado à senha daquela folha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QrCodeCard
              url={publicUrl}
              slug={session.slug}
              posterHref={`/admin/sessoes/${session.id}/imprimir/cartaz`}
            />
            <div className="flex flex-wrap gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                Página do fiel
              </a>
              <a
                href={tvUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                Abrir TV
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg">Confessionários</h2>
            <p className="text-muted-foreground text-sm">
              Imprima o cartão e cole na mesa. O sacerdote entra pelo QR daquele
              posto.
            </p>
          </div>
          {hasPrintableStations ? (
            <Link
              href={`/admin/sessoes/${session.id}/imprimir/confessionarios`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "secondary" })}
            >
              Imprimir cartões de mesa
            </Link>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(stations ?? []).map((station) => {
            const token = stationAccessToken(station.station_access);
            const priestUrl = token
              ? stationPriestUrl(station.id, token)
              : null;

            return (
              <Card key={station.id} size="sm">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{station.name}</CardTitle>
                    <CardDescription>
                      {station.priest_name || "Sacerdote não informado"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {stationStatusLabel[station.status] ?? station.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priestUrl ? (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={priestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Painel do padre
                      </a>
                      <Link
                        href={`/admin/sessoes/${session.id}/imprimir/confessionarios/${station.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        Imprimir cartão
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Token de acesso ainda não disponível.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Adicionar confessionário</CardTitle>
          </CardHeader>
          <CardContent>
            <AddStationForm sessionId={session.id} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg">Senhas</h2>
          <p className="text-muted-foreground text-sm">
            Visão operacional da fila. Tokens anônimos não são exibidos.
          </p>
        </div>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b text-xs tracking-wide uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Senha</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Entrada</th>
                  <th className="px-4 py-3 font-medium">Chamada</th>
                  <th className="px-4 py-3 font-medium">Rechamadas</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-4 py-8 text-center"
                    >
                      Nenhuma senha nesta sessão ainda.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">
                        {ticket.public_code}
                      </td>
                      <td className="px-4 py-3">
                        {ticketStatusLabel[ticket.status] ?? ticket.status}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {formatAdminTime(ticket.created_at)}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {ticket.called_at
                          ? formatAdminTime(ticket.called_at)
                          : "—"}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {ticket.recall_count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </ParishShell>
  );
}
