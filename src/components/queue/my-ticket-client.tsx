"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand-mark";
import { MobileLoading } from "@/components/loading-state";
import { MobileShell } from "@/components/mobile-shell";
import { CancelTicketDialog } from "@/components/queue/cancel-ticket-dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useClaimTicket } from "@/hooks/use-claim-ticket";
import {
  useEstimatedWait,
  useFaithfulTicket,
} from "@/hooks/use-faithful-ticket";
import { usePublicSession } from "@/hooks/use-public-session";
import { ticketStatusLabel } from "@/lib/admin/labels";
import { formatDuration } from "@/lib/admin/metrics";

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
      <MobileLoading
        label={claiming ? "Abrindo sua senha..." : "Carregando sua senha..."}
      />
    );
  }

  if (claimError) {
    return (
      <MobileShell className="justify-center">
        <h1 className="font-heading text-2xl sm:text-3xl">
          Não encontramos esta senha
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{claimError}</p>
        <Link
          href={`/s/${slug}`}
          className={buttonVariants({
            className: "mt-6 h-14 w-full text-base",
          })}
        >
          Voltar para a sessão
        </Link>
      </MobileShell>
    );
  }

  if (!stored || !state) {
    return null;
  }

  if (error || !remote) {
    return (
      <MobileShell className="justify-center">
        <h1 className="font-heading text-2xl sm:text-3xl">
          Não encontramos sua senha
        </h1>
        <p className="text-muted-foreground mt-3 text-base">
          {error ?? "Entre novamente na fila."}
        </p>
        <Link
          href={`/s/${slug}`}
          className={buttonVariants({
            className: "mt-6 h-14 w-full text-base",
          })}
          onClick={() => clearTicket()}
        >
          Voltar para a sessão
        </Link>
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
      className="justify-center gap-4 py-3 text-center"
    >
      <BrandMark
        compact
        onDark={isCalled}
        className="mx-auto"
      />
      <Badge
        variant={isCalled ? "secondary" : "outline"}
        className="mx-auto w-fit text-sm"
      >
        {view === "NEAR" || view === "NEXT"
          ? "Prepare-se"
          : ticketStatusLabel[remote.status ?? "WAITING"]}
      </Badge>

      {isCalled ? (
        <>
          <h1 className="font-heading text-brand-gold-light text-[clamp(2rem,9vw,3rem)]">
            É a sua vez!
          </h1>
          <p className="font-heading text-brand-gold-light text-[clamp(4rem,20vw,6rem)] leading-none font-semibold tracking-tight tabular-nums">
            {publicCode}
          </p>
          <p className="text-primary-foreground/80 text-base sm:text-lg">
            Dirija-se ao
          </p>
          <p className="text-primary-foreground text-[clamp(1.35rem,6vw,1.875rem)] leading-snug font-semibold">
            {remote.station_name ?? "confessionário indicado"}
          </p>
        </>
      ) : null}

      {view === "WAITING" || view === "NEAR" || view === "NEXT" ? (
        <>
          <p className="text-muted-foreground text-base">Sua senha</p>
          <h1 className="font-heading text-[clamp(4rem,20vw,6rem)] leading-none tracking-tight tabular-nums">
            {publicCode}
          </h1>
        </>
      ) : null}

      {view === "IN_SERVICE" ? (
        <>
          <h1 className="font-heading text-[clamp(3rem,16vw,4.5rem)] leading-none tabular-nums">
            {publicCode}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Atendimento iniciado
            {remote.station_name ? ` · ${remote.station_name}` : ""}.
          </p>
        </>
      ) : null}

      {view === "COMPLETED" ? (
        <>
          <h1 className="font-heading text-3xl">Atendimento concluído</h1>
          <p className="text-muted-foreground text-base">Obrigado.</p>
        </>
      ) : null}

      {view === "NO_SHOW" ? (
        <>
          <h1 className="font-heading text-3xl">Você não compareceu</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Sua senha foi chamada, mas não houve comparecimento. Procure a
            equipe responsável.
          </p>
        </>
      ) : null}

      {view === "CANCELLED" ? (
        <>
          <h1 className="font-heading text-3xl">Você saiu da fila</h1>
          <p className="text-muted-foreground text-base">
            Sua participação foi cancelada.
          </p>
        </>
      ) : null}

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

      {stored.wantsWhatsapp &&
      (view === "WAITING" || view === "NEAR" || view === "NEXT") ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Também avisamos no WhatsApp quando for a sua vez.
        </p>
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
        <p className="text-muted-foreground text-sm leading-relaxed">
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
    <div className="space-y-1">
      <p className="text-base font-medium">{title}</p>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      {wait !== undefined ? (
        <p className="text-muted-foreground text-sm">
          Tempo estimado:{" "}
          {wait === null
            ? "Calculando tempo de espera..."
            : `~${formatDuration(wait)}`}
        </p>
      ) : null}
    </div>
  );
}
