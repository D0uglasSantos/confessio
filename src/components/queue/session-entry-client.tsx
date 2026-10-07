"use client";

import { UsersIcon, UserRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand-mark";
import { MobileLoading } from "@/components/loading-state";
import { MobileShell } from "@/components/mobile-shell";
import { JoinQueueButton } from "@/components/queue/join-queue-button";
import { Badge } from "@/components/ui/badge";
import { useClaimTicket } from "@/hooks/use-claim-ticket";
import { usePublicSession } from "@/hooks/use-public-session";
import { useTicket } from "@/hooks/use-ticket";
import { APP_NAME } from "@/lib/brand";
import { countActiveStations } from "@/lib/queue/types";
import { sessionStatusLabel } from "@/lib/admin/labels";
import { formatCounted } from "@/lib/admin/format";

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
        <h1 className="font-heading text-3xl sm:text-4xl">{APP_NAME}</h1>
        <p className="text-muted-foreground mt-3 text-base">
          {error ?? "Sessão não encontrada ou indisponível."}
        </p>
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
    <MobileShell className="gap-5 py-4 sm:max-w-lg sm:justify-center">
      <div className="flex items-center gap-3">
        <BrandMark compact />
        <p className="text-muted-foreground truncate text-sm">
          {session.church_name}
        </p>
      </div>

      <div className="space-y-2">
        <Badge variant="secondary" className="w-fit">
          {sessionStatusLabel[session.status]}
        </Badge>
        <h1 className="font-heading text-primary text-[clamp(2.15rem,8vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          {isOpen ? "Aguarde sua vez" : "Confissões"}
        </h1>
        <p className="text-foreground text-base font-medium">{session.name}</p>
      </div>

      {isOpen ? (
        <>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <UserRoundIcon className="size-4" />
              {formatCounted(activePriests, {
                one: "sacerdote atendendo",
                other: "sacerdotes atendendo",
              })}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon className="size-4" />
              {formatCounted(waiting_count, {
                one: "aguardando",
                other: "aguardando",
              })}
            </span>
          </p>
          {claimError ? (
            <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
              {claimError}
            </p>
          ) : null}
          <JoinQueueButton sessionId={session.id} slug={slug} />
        </>
      ) : null}

      {entryClosed ? (
        <div className="space-y-3">
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
        <p className="font-medium">As confissões desta sessão foram encerradas.</p>
      ) : null}

      {session.status === "DRAFT" ? (
        <div className="space-y-1">
          <p className="font-medium">A fila ainda não foi aberta.</p>
          <p className="text-muted-foreground text-sm">
            Aguarde a equipe da paróquia iniciar a sessão.
          </p>
        </div>
      ) : null}
    </MobileShell>
  );
}
