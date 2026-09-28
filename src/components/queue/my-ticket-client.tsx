"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand-mark";
import { MobileShell } from "@/components/mobile-shell";
import { CancelTicketDialog } from "@/components/queue/cancel-ticket-dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClaimTicket } from "@/hooks/use-claim-ticket";
import {
  useEstimatedWait,
  useFaithfulTicket,
} from "@/hooks/use-faithful-ticket";
import { usePublicSession } from "@/hooks/use-public-session";
import { ticketStatusLabel } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";

export function MyTicketClient({
  slug,
  claimToken,
}: {
  slug: string;
  claimToken?: string;
}) {
  const router = useRouter();
  const { claiming, claimError } = useClaimTicket(slug, claimToken);
  const { state, isLoading: sessionLoading } = usePublicSession(slug);
  const {
    stored,
    remote,
    peopleAhead,
    view,
    averageServiceMinutes,
    isLoading,
    error,
    clearTicket,
  } = useFaithfulTicket(state?.session ?? null);

  const estimatedMinutes = useEstimatedWait(
    peopleAhead,
    state?.stations,
    averageServiceMinutes,
  );

  useEffect(() => {
    if (sessionLoading || isLoading || claiming || claimToken) return;
    if (!stored) {
      router.replace(`/s/${slug}`);
    }
  }, [claimToken, claiming, isLoading, router, sessionLoading, slug, stored]);

  if (sessionLoading || isLoading || claiming) {
    return (
      <MobileShell className="justify-center">
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="text-muted-foreground py-12 text-center">
            {claiming ? "Abrindo sua senha..." : "Carregando sua senha..."}
          </CardContent>
        </Card>
      </MobileShell>
    );
  }

  if (claimError) {
    return (
      <MobileShell className="justify-center">
        <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="px-1 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl">
              Não encontramos esta senha
            </CardTitle>
            <CardDescription className="text-base">
              {claimError}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-1 sm:px-6">
            <Link
              href={`/s/${slug}`}
              className={buttonVariants({
                className: "h-14 w-full text-base",
              })}
            >
              Voltar para a sessão
            </Link>
          </CardContent>
        </Card>
      </MobileShell>
    );
  }

  if (!stored || !state) {
    return null;
  }

  if (error || !remote) {
    return (
      <MobileShell className="justify-center">
        <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="px-1 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl">
              Não encontramos sua senha
            </CardTitle>
            <CardDescription className="text-base">
              {error ?? "Entre novamente na fila."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-1 sm:px-6">
            <Link
              href={`/s/${slug}`}
              className={buttonVariants({
                className: "h-14 w-full text-base",
              })}
              onClick={() => clearTicket()}
            >
              Voltar para a sessão
            </Link>
          </CardContent>
        </Card>
      </MobileShell>
    );
  }

  const publicCode = remote.public_code ?? stored.publicCode;
  const currentService = state.stations.find((station) =>
    ["CALLING", "BUSY"].includes(station.status),
  );
  const isCalled = view === "CALLED";

  return (
    <MobileShell
      tone={isCalled ? "urgent" : "default"}
      className="justify-center gap-3 py-3"
    >
      <Card
        className={cn(
          "w-full border-0 shadow-none sm:border sm:shadow-sm",
          isCalled && "border-primary bg-card ring-primary/20 ring-4 sm:border",
        )}
      >
        <CardHeader className="space-y-4 px-1 text-center sm:px-6">
          <BrandMark compact className="mx-auto" />
          <Badge
            variant={isCalled ? "default" : "secondary"}
            className="mx-auto w-fit text-sm"
          >
            {view === "NEAR" || view === "NEXT"
              ? "Prepare-se"
              : ticketStatusLabel[remote.status ?? "WAITING"]}
          </Badge>

          {isCalled ? (
            <>
              <CardTitle className="font-heading text-primary text-[clamp(2rem,9vw,3rem)]">
                Sua vez!
              </CardTitle>
              <p className="font-heading text-[clamp(3.5rem,18vw,5.5rem)] leading-none font-semibold tracking-tight">
                {publicCode}
              </p>
              <CardDescription className="text-base sm:text-lg">
                Dirija-se ao
              </CardDescription>
              <p className="text-[clamp(1.35rem,6vw,1.875rem)] leading-snug font-semibold">
                {remote.station_name ?? "confessionário indicado"}
              </p>
            </>
          ) : null}

          {view === "WAITING" || view === "NEAR" || view === "NEXT" ? (
            <>
              <CardDescription className="text-base">Sua senha</CardDescription>
              <CardTitle className="font-heading text-[clamp(3.5rem,18vw,5.5rem)] leading-none tracking-tight">
                {publicCode}
              </CardTitle>
            </>
          ) : null}

          {view === "IN_SERVICE" ? (
            <>
              <CardTitle className="font-heading text-[clamp(2.75rem,14vw,4rem)] leading-none">
                {publicCode}
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Atendimento iniciado
                {remote.station_name ? ` · ${remote.station_name}` : ""}.
              </CardDescription>
            </>
          ) : null}

          {view === "COMPLETED" ? (
            <>
              <CardTitle className="font-heading text-3xl">
                Atendimento concluído
              </CardTitle>
              <CardDescription className="text-base">Obrigado.</CardDescription>
            </>
          ) : null}

          {view === "NO_SHOW" ? (
            <>
              <CardTitle className="font-heading text-3xl">
                Você não compareceu
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Sua senha foi chamada, mas não houve comparecimento. Procure a
                equipe responsável.
              </CardDescription>
            </>
          ) : null}

          {view === "CANCELLED" ? (
            <>
              <CardTitle className="font-heading text-3xl">
                Você saiu da fila
              </CardTitle>
              <CardDescription className="text-base">
                Sua participação foi cancelada.
              </CardDescription>
            </>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4 px-1 sm:px-6">
          {view === "WAITING" ? (
            <StatusBlock
              title="Você está na fila"
              body={
                peopleAhead === 1
                  ? "1 pessoa à sua frente."
                  : `${peopleAhead} pessoas à sua frente.`
              }
              wait={estimatedMinutes}
            />
          ) : null}

          {view === "NEAR" ? (
            <StatusBlock
              title="Você está próximo"
              body={`Há apenas ${peopleAhead} pessoa${peopleAhead === 1 ? "" : "s"} antes de você. Permaneça próximo aos confessionários.`}
              wait={estimatedMinutes}
            />
          ) : null}

          {view === "NEXT" ? (
            <StatusBlock
              title="Você é o próximo da fila"
              body="Permaneça próximo aos confessionários. É a sua vez em breve."
            />
          ) : null}

          {(view === "WAITING" || view === "NEAR" || view === "NEXT") &&
          currentService?.current_public_code ? (
            <p className="bg-muted/60 text-muted-foreground rounded-2xl px-4 py-3 text-center text-sm leading-relaxed">
              Fila atual: {currentService.current_public_code} está sendo
              atendida
              {currentService.name ? ` em ${currentService.name}` : ""}.
            </p>
          ) : null}

          {view === "WAITING" || view === "NEAR" || view === "NEXT" ? (
            <CancelTicketDialog
              token={stored.anonymousToken}
              onCancelled={() => {
                clearTicket();
                router.replace(`/s/${slug}`);
              }}
            />
          ) : null}

          {view === "COMPLETED" ||
          view === "CANCELLED" ||
          view === "NO_SHOW" ? (
            <Link
              href={`/s/${slug}`}
              className={buttonVariants({
                variant: "outline",
                className: "h-14 w-full text-base",
              })}
              onClick={() => clearTicket()}
            >
              Voltar
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </MobileShell>
  );
}

function StatusBlock({
  title,
  body,
  wait,
}: {
  title: string;
  body: string;
  wait?: number | null;
}) {
  return (
    <div className="bg-muted/60 space-y-2 rounded-2xl p-4 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      {wait !== undefined ? (
        <p className="text-muted-foreground text-sm">
          Tempo estimado:{" "}
          {wait === null
            ? "Calculando tempo de espera..."
            : `~${wait} minuto${wait === 1 ? "" : "s"}`}
        </p>
      ) : null}
    </div>
  );
}
