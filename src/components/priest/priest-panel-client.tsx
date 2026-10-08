"use client";

import { BrandMark } from "@/components/brand-mark";
import { MobileLoading } from "@/components/loading-state";
import { MobileShell } from "@/components/mobile-shell";
import { PriestActions } from "@/components/priest/priest-actions";
import { Badge } from "@/components/ui/badge";
import { useStationState } from "@/hooks/use-station-state";
import {
  sessionStatusLabel,
  stationStatusLabel,
  ticketStatusLabel,
} from "@/lib/admin/labels";
import { formatCounted } from "@/lib/admin/format";

export function PriestPanelClient({
  stationId,
  accessToken,
}: {
  stationId: string;
  accessToken: string | null;
}) {
  const { state, error, isLoading, refresh } = useStationState(
    stationId,
    accessToken,
  );

  if (isLoading) {
    return <MobileLoading label="Carregando confessionário..." />;
  }

  if (error || !state || !accessToken) {
    return (
      <MobileShell className="justify-center">
        <h1 className="font-heading text-3xl">Painel do sacerdote</h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          {error ??
            "Abra este painel pelo link gerado na administração da sessão."}
        </p>
      </MobileShell>
    );
  }

  const { session, station, current_ticket: ticket, waiting_count } = state;
  const elapsed = ticketElapsedLabel(ticket?.started_at ?? ticket?.called_at);

  return (
    <MobileShell className="gap-4 py-3">
      <header className="shrink-0 space-y-3">
        <BrandMark compact />
        <div className="flex flex-wrap gap-2">
          <Badge variant={station.status === "PAUSED" ? "warning" : "success"}>
            {stationStatusLabel[station.status]}
          </Badge>
          <Badge variant="outline">
            {sessionStatusLabel[session.status]}
          </Badge>
        </div>
        <h1 className="font-heading text-[clamp(1.75rem,7vw,2.25rem)] leading-tight">
          {station.name}
        </h1>
        <p className="text-muted-foreground text-base">
          {station.priest_name
            ? station.priest_name
            : "Confessionário sem nome do sacerdote"}
        </p>
      </header>

      <section className="flex min-h-0 flex-1 flex-col items-center justify-center py-4 text-center">
        {ticket ? (
          <>
            <p className="text-muted-foreground text-sm">
              {ticketStatusLabel[ticket.status]}
            </p>
            <p className="font-heading mt-2 text-[clamp(5.5rem,24vw,7.5rem)] leading-none tracking-tight tabular-nums">
              {ticket.public_code}
            </p>
            <p className="text-muted-foreground mt-4 text-sm">
              {formatCounted(waiting_count, {
                one: "pessoa na fila",
                other: "pessoas na fila",
              })}
              {elapsed ? ` · ${elapsed}` : ""}
            </p>
            {ticket.recall_count > 0 ? (
              <p className="text-muted-foreground mt-1 text-sm">
                Rechamadas: {ticket.recall_count}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="font-heading text-primary text-[clamp(1.75rem,6vw,2.25rem)] leading-snug">
              Pronto para chamar a próxima
            </p>
            <p className="text-muted-foreground mt-4 text-base">
              {waiting_count === 0
                ? "Ninguém aguardando"
                : formatCounted(waiting_count, {
                    one: "pessoa na fila",
                    other: "pessoas na fila",
                  })}
            </p>
          </>
        )}
      </section>

      <div className="bg-background/95 sticky bottom-0 mt-auto pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <PriestActions
          stationId={stationId}
          accessToken={accessToken}
          state={state}
          onDone={refresh}
        />
      </div>
    </MobileShell>
  );
}

function ticketElapsedLabel(startedAt: string | null | undefined) {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return null;
  const minutes = Math.max(0, Math.floor((Date.now() - start) / 60_000));
  if (minutes < 1) return "agora";
  return `${minutes} min`;
}
