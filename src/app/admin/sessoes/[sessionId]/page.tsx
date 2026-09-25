import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AddStationForm } from "@/components/admin/add-station-form";
import { AdminSessionRealtime } from "@/components/admin/admin-session-realtime";
import { PrintTicketBatchForm } from "@/components/admin/print-ticket-batch-form";
import { QrCodeCard } from "@/components/admin/qr-code-card";
import { SessionLifecycleActions } from "@/components/admin/session-lifecycle-actions";
import { SessionMetricsGrid } from "@/components/admin/session-metrics-grid";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdminChurch } from "@/lib/admin/church";
import {
  sessionStatusLabel,
  stationStatusLabel,
  ticketStatusLabel,
} from "@/lib/admin/labels";
import { parseAdminSessionState } from "@/lib/admin/metrics";
import { stationAccessToken } from "@/lib/admin/station-access";
import {
  getAppUrl,
  sessionPublicUrl,
  sessionTvUrl,
  stationPriestUrl,
} from "@/lib/app-url";

type AdminSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function AdminSessionPage({
  params,
}: AdminSessionPageProps) {
  const { sessionId } = await params;
  const { supabase, church } = await requireAdminChurch();

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, name, slug, status, ticket_prefix, starts_at, show_waiting_queue_on_tv, church_id",
    )
    .eq("id", sessionId)
    .maybeSingle();

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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <AdminSessionRealtime sessionId={session.id} />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Voltar
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-4xl">{session.name}</h1>
            <Badge>{sessionStatusLabel[session.status]}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Prefixo {session.ticket_prefix} · /s/{session.slug}
            {session.starts_at
              ? ` · ${format(new Date(session.starts_at), "dd/MM HH:mm", { locale: ptBR })}`
              : null}
          </p>
        </div>
        <SignOutButton />
      </header>

      <SessionMetricsGrid metrics={metrics} />

      <Card>
        <CardHeader>
          <CardTitle>Operação</CardTitle>
          <CardDescription>
            Abra a fila quando os sacerdotes estiverem prontos. Encerrar a
            entrada impede novas senhas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionLifecycleActions
            sessionId={session.id}
            status={session.status}
            showWaitingQueueOnTv={session.show_waiting_queue_on_tv}
          />
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="mb-2 font-medium">Imprimir senhas de papel</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Ao abrir a fila, imprima o lote. Todo mundo recebe um papel. Quem
              tiver celular escaneia o QR do papel ou o da TV.
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
              Abrir página do fiel
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
          <p className="text-xs text-muted-foreground">
            App local: {getAppUrl()}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Confessionários</h2>
            <p className="text-sm text-muted-foreground">
              Imprima o cartão, cole na mesa. O sacerdote aponta a câmera e
              entra no painel daquele posto.
            </p>
          </div>
          {(stations ?? []).some((station) =>
            stationAccessToken(station.station_access),
          ) ? (
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

        <div className="grid gap-4">
          {(stations ?? []).map((station) => {
            const token = stationAccessToken(station.station_access);
            const priestUrl = token
              ? stationPriestUrl(station.id, token)
              : null;

            return (
              <Card key={station.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{station.name}</CardTitle>
                    <CardDescription>
                      {station.priest_name || "Sacerdote não informado"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {stationStatusLabel[station.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priestUrl ? (
                    <>
                      <p className="break-all text-sm text-muted-foreground">
                        {priestUrl}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={priestUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: "outline" })}
                        >
                          Abrir painel do padre
                        </a>
                        <Link
                          href={`/admin/sessoes/${session.id}/imprimir/confessionarios/${station.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: "secondary" })}
                        >
                          Imprimir cartão
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Token de acesso ainda não disponível.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        <Card>
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
          <h2 className="text-xl font-semibold">Senhas</h2>
          <p className="text-sm text-muted-foreground">
            Visão operacional da fila. Tokens anônimos não são exibidos.
          </p>
        </div>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
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
                      className="px-4 py-8 text-center text-muted-foreground"
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
                        {ticketStatusLabel[ticket.status]}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(ticket.created_at), "HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ticket.called_at
                          ? format(new Date(ticket.called_at), "HH:mm", {
                              locale: ptBR,
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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
    </main>
  );
}
