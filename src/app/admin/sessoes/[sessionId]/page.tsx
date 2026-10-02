import Link from "next/link";
import { notFound } from "next/navigation";

import { AddStationForm } from "@/components/admin/add-station-form";
import { AdminSessionRealtime } from "@/components/admin/admin-session-realtime";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { PrintTicketBatchForm } from "@/components/admin/print-ticket-batch-form";
import { QrCodeCard } from "@/components/admin/qr-code-card";
import { RescheduleSessionForm } from "@/components/admin/reschedule-session-form";
import { SessionLifecycleActions } from "@/components/admin/session-lifecycle-actions";
import { SessionMetricsGrid } from "@/components/admin/session-metrics-grid";
import { SessionPrepChecklist } from "@/components/admin/session-prep-checklist";
import { SessionStationCard } from "@/components/admin/session-station-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminChurch } from "@/lib/admin/church";
import { isPastInBrazil } from "@/lib/admin/datetime";
import { formatAdminDayTime, formatAdminTime } from "@/lib/admin/format";
import { ticketStatusLabel } from "@/lib/admin/labels";
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
        "id, name, slug, status, ticket_prefix, starts_at, ends_at, show_waiting_queue_on_tv, church_id",
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
  const live = session.status === "OPEN" || session.status === "ENTRY_CLOSED";
  const pastDraft =
    session.status === "DRAFT" && isPastInBrazil(session.starts_at);

  const ticketTable = (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg">Senhas</h2>
        <p className="text-muted-foreground text-sm">
          Por privacidade, nenhum dado do fiel é exibido.
        </p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b text-xs tracking-wide uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Senha
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Entrada
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Chamada
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Rechamadas
                </th>
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
  );

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <AdminSessionRealtime sessionId={session.id} />

      <header className="bg-background/95 sticky top-0 z-20 -mx-4 flex flex-wrap items-start justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl tracking-tight">
              {session.name}
            </h1>
            <SessionStatusBadge status={session.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Prefixo {session.ticket_prefix}
            {session.starts_at
              ? ` · ${formatAdminDayTime(session.starts_at)}`
              : null}
          </p>
        </div>
        <SessionLifecycleActions
          sessionId={session.id}
          status={session.status}
          showWaitingQueueOnTv={session.show_waiting_queue_on_tv}
          mode="primary"
        />
      </header>

      <SessionMetricsGrid metrics={metrics} compact={session.status === "DRAFT"} />

      {session.status === "DRAFT" ? (
        <SessionPrepChecklist
          sessionId={session.id}
          status={session.status}
          stationCount={(stations ?? []).length}
          hasPrintableStations={hasPrintableStations}
        />
      ) : null}

      {pastDraft ? (
        <Card id="reagendar">
          <CardHeader>
            <CardTitle>Horário já passou</CardTitle>
            <CardDescription>
              Reagende o rascunho antes de abrir a fila.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RescheduleSessionForm
              sessionId={session.id}
              startsAt={session.starts_at}
              endsAt={session.ends_at}
            />
          </CardContent>
        </Card>
      ) : session.status === "DRAFT" ? (
        <Card id="reagendar">
          <CardHeader>
            <CardTitle>Horário</CardTitle>
            <CardDescription>Ajuste início e término previstos.</CardDescription>
          </CardHeader>
          <CardContent>
            <RescheduleSessionForm
              sessionId={session.id}
              startsAt={session.starts_at}
              endsAt={session.ends_at}
            />
          </CardContent>
        </Card>
      ) : null}

      <section
        className={
          live ? "grid items-start gap-4 xl:grid-cols-2" : "grid gap-4 xl:grid-cols-2"
        }
      >
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operação</CardTitle>
              <CardDescription>
                Encerrar a entrada impede novas senhas. A TV atualiza sozinha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SessionLifecycleActions
                sessionId={session.id}
                status={session.status}
                showWaitingQueueOnTv={session.show_waiting_queue_on_tv}
                mode="tv"
              />
              <div className="border-t pt-5">
                <h3 className="mb-1 font-medium">Senhas de papel</h3>
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
              <CardTitle>Telão e fiel</CardTitle>
              <CardDescription>
                Use F11 para tela cheia na TV. O cartaz usa o mesmo QR da página
                do fiel.
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
                  href={tvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "lg" })}
                >
                  Abrir TV
                </a>
                <CopyLinkButton url={tvUrl} label="Copiar link da TV" size="lg" />
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Página do fiel
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {live ? ticketTable : (
          <div className="space-y-4">
            <p className="sr-only">Fila</p>
          </div>
        )}
      </section>

      <section id="confessionarios" className="space-y-4">
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
              <SessionStationCard
                key={station.id}
                sessionId={session.id}
                station={station}
                priestUrl={priestUrl}
                printHref={`/admin/sessoes/${session.id}/imprimir/confessionarios/${station.id}`}
                sessionOpen={live}
              />
            );
          })}
        </div>

        {session.status !== "FINISHED" && session.status !== "CANCELLED" ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Adicionar confessionário</CardTitle>
            </CardHeader>
            <CardContent>
              <AddStationForm sessionId={session.id} />
            </CardContent>
          </Card>
        ) : null}
      </section>

      {live ? null : ticketTable}
    </ParishShell>
  );
}
