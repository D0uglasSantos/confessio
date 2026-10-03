"use client";

import { UsersIcon, UserRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand-mark";
import { MobileLoading } from "@/components/loading-state";
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
import { APP_NAME } from "@/lib/brand";
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
      <MobileLoading
        label={claiming ? "Abrindo sua senha..." : "Carregando sessão..."}
      />
    );
  }

  if (error || !state) {
    return (
      <MobileShell className="justify-center">
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="px-1 sm:px-6">
            <CardTitle className="font-heading text-3xl sm:text-4xl">
              {APP_NAME}
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
      <Card className="relative w-full overflow-hidden border-0 shadow-none sm:border sm:shadow-sm">
        <ArchMark />
        <CardHeader className="relative space-y-4 px-1 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="font-heading text-primary text-lg leading-none">
                {APP_NAME}
              </p>
              <p className="text-muted-foreground mt-1 truncate text-sm">
                {session.church_name}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              {sessionStatusLabel[session.status]}
            </Badge>
            <CardTitle className="font-heading text-primary text-[clamp(2.15rem,8vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
              {isOpen ? "Aguarde sua vez" : "Confissões"}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {isOpen
                ? "Entre na fila desta confissão e acompanhe a sua vez."
                : "Acompanhe o momento desta sessão de confissão."}
            </CardDescription>
            <p className="text-foreground pt-1 text-sm font-semibold tracking-[0.08em] uppercase">
              {session.name}
            </p>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-5 px-1 sm:px-6">
          {isOpen ? (
            <>
              <LiveSessionCard
                activePriests={activePriests}
                waitingCount={waiting_count}
              />
              {claimError ? (
                <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                  {claimError}
                </p>
              ) : null}
              <PaperQrCard />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sem papel, entre na fila aqui embaixo.
              </p>
              <JoinQueueButton sessionId={session.id} slug={slug} />
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

function LiveSessionCard({
  activePriests,
  waitingCount,
}: {
  activePriests: number;
  waitingCount: number;
}) {
  return (
    <div className="bg-primary/5 flex gap-3 rounded-2xl p-4">
      <div className="border-primary/15 flex w-16 shrink-0 items-center justify-center border-r pr-3">
        <BrandMark compact />
      </div>
      <div className="min-w-0 space-y-2.5">
        <p className="text-primary text-sm font-semibold">
          Confissões acontecendo agora
        </p>
        <p className="flex items-center gap-2 text-sm">
          <UserRoundIcon className="text-primary size-4 shrink-0" />
          <span>
            <span className="font-semibold">{activePriests}</span>{" "}
            {activePriests === 1 ? "sacerdote" : "sacerdotes"} atendendo
          </span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          <UsersIcon className="text-primary size-4 shrink-0" />
          <span>
            <span className="font-semibold">{waitingCount}</span>{" "}
            {waitingCount === 1 ? "pessoa" : "pessoas"} aguardando
          </span>
        </p>
      </div>
    </div>
  );
}

function PaperQrCard() {
  return (
    <div className="border-border space-y-1.5 rounded-2xl border p-4">
      <p className="text-primary text-sm font-semibold">
        Você tem um código (QR Code)?
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Aponte a câmera do celular para o código no papel e acompanhe a mesma
        senha. Sem celular, siga pelo papel e pelo telão.
      </p>
    </div>
  );
}

function ArchMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 180"
      className="text-primary/10 pointer-events-none absolute -top-2 -right-4 h-40 w-36"
    >
      <path
        d="M20 170V78a48 48 0 0 1 96 0v92"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M36 170V86a32 32 0 0 1 64 0v84"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}

