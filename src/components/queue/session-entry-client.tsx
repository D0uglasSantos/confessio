"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { MobileShell } from "@/components/mobile-shell";
import { JoinQueueButton } from "@/components/queue/join-queue-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClaimTicket } from "@/hooks/use-claim-ticket";
import { usePublicSession } from "@/hooks/use-public-session";
import { useTicket } from "@/hooks/use-ticket";
import { countActiveStations } from "@/lib/queue/types";
import { sessionStatusLabel } from "@/lib/admin/labels";

export function SessionEntryClient({
  slug,
  claimToken,
}: {
  slug: string;
  claimToken?: string;
}) {
  const router = useRouter();
  const { ticket } = useTicket();
  const { claiming, claimError } = useClaimTicket(slug, claimToken);
  const { state, error, isLoading } = usePublicSession(slug);

  useEffect(() => {
    if (!state || !ticket) return;
    if (ticket.sessionId === state.session.id) {
      router.replace(`/s/${slug}/minha-senha`);
    }
  }, [router, slug, state, ticket]);

  if (isLoading || claiming) {
    return (
      <MobileShell className="justify-center">
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="text-muted-foreground py-12 text-center">
            {claiming ? "Abrindo sua senha..." : "Carregando sessão..."}
          </CardContent>
        </Card>
      </MobileShell>
    );
  }

  if (error || !state) {
    return (
      <MobileShell className="justify-center">
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="px-1 sm:px-6">
            <CardTitle className="font-heading text-3xl sm:text-4xl">
              Confissões
            </CardTitle>
            <CardDescription className="text-base">
              {error ?? "Sessão não encontrada ou indisponível."}
            </CardDescription>
          </CardHeader>
        </Card>
      </MobileShell>
    );
  }

  const { session, stations, waiting_count } = state;
  const activePriests = countActiveStations(stations);
  const isOpen = session.status === "OPEN";
  const entryClosed = session.status === "ENTRY_CLOSED";
  const finished =
    session.status === "FINISHED" || session.status === "CANCELLED";

  return (
    <MobileShell className="justify-center gap-4 py-4">
      <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-3 px-1 sm:px-6">
          <BrandMark className="text-primary mb-3" />
          <Badge variant="secondary" className="w-fit">
            {sessionStatusLabel[session.status]}
          </Badge>
          <CardTitle className="font-heading text-[clamp(2rem,8vw,2.75rem)] leading-tight font-semibold tracking-[-0.025em]">
            Bem-vindo à fila
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {session.church_name}
          </CardDescription>
          <p className="text-muted-foreground text-sm">{session.name}</p>
        </CardHeader>
        <CardContent className="space-y-5 px-1 sm:px-6">
          {isOpen ? (
            <>
              <div className="bg-muted/60 space-y-2 rounded-2xl p-4">
                <p className="text-primary text-sm font-medium">
                  Confissões acontecendo agora
                </p>
                <p className="text-muted-foreground text-sm">
                  {activePriests} sacerdote{activePriests === 1 ? "" : "s"}{" "}
                  atendendo
                </p>
                <p className="text-muted-foreground text-sm">
                  {waiting_count} pessoa{waiting_count === 1 ? "" : "s"}{" "}
                  aguardando
                </p>
              </div>
              {claimError ? (
                <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                  {claimError}
                </p>
              ) : null}
              <div className="border-border space-y-2 rounded-2xl border p-4">
                <p className="text-sm font-medium">Recebeu um papel?</p>
                <p className="text-muted-foreground text-sm">
                  Aponte a câmera no QR do papel para ver a mesma senha no
                  celular. Sem celular, acompanhe pelo papel e pelo telão.
                </p>
              </div>
              <JoinQueueButton sessionId={session.id} slug={slug} />
              <p className="text-muted-foreground text-center text-xs">
                Sem papel? Entre na fila por aqui ou pelo QR da TV.
              </p>
            </>
          ) : null}

          {entryClosed ? (
            <div className="bg-muted/60 space-y-3 rounded-2xl p-4">
              <p className="font-medium">A entrada na fila foi encerrada.</p>
              <p className="text-muted-foreground text-sm">
                As pessoas já cadastradas continuam sendo atendidas.
              </p>
              {ticket?.sessionId === session.id ? (
                <JoinQueueButton sessionId={session.id} slug={slug} />
              ) : null}
            </div>
          ) : null}

          {finished ? (
            <div className="bg-muted/60 rounded-2xl p-4">
              <p className="font-medium">
                As confissões desta sessão foram encerradas.
              </p>
            </div>
          ) : null}

          {session.status === "DRAFT" ? (
            <div className="bg-muted/60 rounded-2xl p-4">
              <p className="font-medium">A fila ainda não foi aberta.</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Aguarde a equipe da paróquia iniciar a sessão.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </MobileShell>
  );
}
