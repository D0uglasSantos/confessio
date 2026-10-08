import Link from "next/link";
import { notFound } from "next/navigation";

import { AddStationForm } from "@/components/admin/add-station-form";
import { AdminSessionRealtime } from "@/components/admin/admin-session-realtime";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { PrintTicketBatchForm } from "@/components/admin/print-ticket-batch-form";
import { QrCodeCard } from "@/components/admin/qr-code-card";
import { RescheduleSessionDialog } from "@/components/admin/reschedule-session-dialog";
import { SessionDetailTabs } from "@/components/admin/session-detail-tabs";
import { SessionLifecycleActions } from "@/components/admin/session-lifecycle-actions";
import { SessionMetricsGrid } from "@/components/admin/session-metrics-grid";
import { SessionPrepChecklist } from "@/components/admin/session-prep-checklist";
import { SessionStationCard } from "@/components/admin/session-station-card";
import { SessionTicketTable } from "@/components/admin/session-ticket-table";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminChurch } from "@/lib/admin/church";
import { isPastInBrazil } from "@/lib/admin/datetime";
import { formatAdminDayTime } from "@/lib/admin/format";
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
  const isDraft = session.status === "DRAFT";

  const queuePanel = (
    <section className="space-y-3">
      <div>
        <h2 className="sr-only">Senhas</h2>
        <p className="text-muted-foreground text-sm">
          Por privacidade, nenhum dado do fiel é exibido.
        </p>
      </div>
      <SessionTicketTable tickets={tickets} />
    </section>
  );

  const stationsPanel = (
    <section id="confessionarios" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Imprima o cartão e cole na mesa. O sacerdote entra pelo QR daquele
          posto.
        </p>
        {hasPrintableStations ? (
          <Link
            href={`/admin/sessoes/${session.id}/imprimir/confessionarios`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Imprimir cartões de mesa
          </Link>
        ) : null}
      </div>

      <div>
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
        <div className="border-border/70 border-t pt-4">
          <p className="mb-3 text-sm font-medium">Adicionar confessionário</p>
          <AddStationForm sessionId={session.id} />
        </div>
      ) : null}
    </section>
  );

  const prepPanel = isDraft ? (
    <SessionPrepChecklist
      sessionId={session.id}
      status={session.status}
      stationCount={(stations ?? []).length}
      hasPrintableStations={hasPrintableStations}
    />
  ) : null;

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <AdminSessionRealtime sessionId={session.id} />

      <header className="bg-background/95 sticky top-0 z-20 -mx-4 flex flex-wrap items-start justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="min-w-0">
          <nav
            aria-label="Navegação estrutural"
            className="text-muted-foreground mb-1 flex flex-wrap items-center gap-1.5 text-xs"
          >
            <Link
              href="/admin/sessoes"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Sessões
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground truncate">{session.name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl tracking-tight">
              {session.name}
            </h1>
            <SessionStatusBadge status={session.status} />
          </div>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-sm">
            <span>Prefixo {session.ticket_prefix}</span>
            {session.starts_at ? (
              <span>· {formatAdminDayTime(session.starts_at)}</span>
            ) : null}
            {isDraft ? (
              <RescheduleSessionDialog
                sessionId={session.id}
                startsAt={session.starts_at}
                endsAt={session.ends_at}
                pastDraft={pastDraft}
              />
            ) : null}
          </p>
        </div>
        <SessionLifecycleActions
          sessionId={session.id}
          status={session.status}
          showWaitingQueueOnTv={session.show_waiting_queue_on_tv}
          mode="primary"
        />
      </header>

      <SessionMetricsGrid metrics={metrics} compact={isDraft} />

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <SessionDetailTabs
          defaultTab={live ? "queue" : isDraft ? "prep" : "queue"}
          queue={queuePanel}
          stations={stationsPanel}
          prep={prepPanel}
        />

        <aside className="border-border/70 xl:sticky xl:top-24 space-y-8 border-t pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
          <div className="space-y-3">
            <h2 className="font-heading text-lg">Divulgação & operação</h2>
            <QrCodeCard
              url={publicUrl}
              slug={session.slug}
              posterHref={`/admin/sessoes/${session.id}/imprimir/cartaz`}
            />
          </div>

          <div className="space-y-3">
            <p className="overline-label">Atalhos de tela</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={tvUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "secondary" })}
              >
                Abrir TV
              </a>
              <CopyLinkButton url={tvUrl} label="Copiar link da TV" />
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "ghost" })}
              >
                Página do fiel
              </a>
            </div>
            <p className="text-muted-foreground text-xs">
              Use F11 para tela cheia na TV.
            </p>
            <SessionLifecycleActions
              sessionId={session.id}
              status={session.status}
              showWaitingQueueOnTv={session.show_waiting_queue_on_tv}
              mode="tv"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Senhas de papel</h3>
            <PrintTicketBatchForm
              sessionId={session.id}
              ticketPrefix={session.ticket_prefix}
              disabled={session.status !== "OPEN"}
              batches={printBatches ?? []}
            />
          </div>
        </aside>
      </div>
    </ParishShell>
  );
}
