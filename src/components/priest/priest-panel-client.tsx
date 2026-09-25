"use client";

import { MobileShell } from "@/components/mobile-shell";
import { PriestActions } from "@/components/priest/priest-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStationState } from "@/hooks/use-station-state";
import {
  sessionStatusLabel,
  stationStatusLabel,
  ticketStatusLabel,
} from "@/lib/admin/labels";

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
    return (
      <MobileShell className="justify-center">
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando confessionário...
          </CardContent>
        </Card>
      </MobileShell>
    );
  }

  if (error || !state || !accessToken) {
    return (
      <MobileShell className="justify-center">
        <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="px-1 sm:px-6">
            <CardTitle className="font-heading text-3xl">
              Painel do sacerdote
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {error ??
                "Abra este painel pelo link gerado na administração da sessão."}
            </CardDescription>
          </CardHeader>
        </Card>
      </MobileShell>
    );
  }

  const { session, station, current_ticket: ticket, waiting_count } = state;

  return (
    <MobileShell className="gap-4 py-3">
      <Card className="flex min-h-0 flex-1 flex-col border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="shrink-0 space-y-3 px-1 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {stationStatusLabel[station.status]}
            </Badge>
            <Badge variant="outline">
              {sessionStatusLabel[session.status]}
            </Badge>
          </div>
          <CardTitle className="font-heading text-[clamp(1.75rem,7vw,2.25rem)] leading-tight">
            {station.name}
          </CardTitle>
          <CardDescription className="text-base">
            {station.priest_name
              ? station.priest_name
              : "Confessionário sem nome do sacerdote"}
          </CardDescription>
          <p className="text-sm text-muted-foreground">{session.name}</p>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-5 px-1 sm:px-6">
          <div className="rounded-2xl bg-muted/60 px-4 py-6 text-center">
            {ticket ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {ticketStatusLabel[ticket.status]}
                </p>
                <p className="font-heading mt-2 text-[clamp(3.25rem,16vw,5rem)] leading-none tracking-tight">
                  {ticket.public_code}
                </p>
                {ticket.recall_count > 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Rechamadas: {ticket.recall_count}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Senha atual</p>
                <p className="font-heading mt-2 text-4xl text-muted-foreground">
                  —
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {waiting_count === 0
                    ? "Ninguém aguardando"
                    : `${waiting_count} pessoa${waiting_count === 1 ? "" : "s"} na fila`}
                </p>
              </>
            )}
          </div>

          <div className="mt-auto sticky bottom-0 bg-background/95 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <PriestActions
              stationId={stationId}
              accessToken={accessToken}
              state={state}
              onDone={refresh}
            />
          </div>
        </CardContent>
      </Card>
    </MobileShell>
  );
}
