"use client";

import { BrandMark } from "@/components/brand-mark";
import { PulseBlock } from "@/components/loading-state";
import { QrImage } from "@/components/qr-image";
import { usePublicSession } from "@/hooks/use-public-session";
import { sessionStatusLabel, stationStatusLabel } from "@/lib/admin/labels";
import { formatCounted } from "@/lib/admin/format";
import { sessionPublicUrl } from "@/lib/app-url";
import type { PublicStationState } from "@/lib/queue/types";
import { cn } from "@/lib/utils";

export function TvBoardClient({ slug }: { slug: string }) {
  const { state, error, isLoading } = usePublicSession(slug);

  if (isLoading) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center px-8"
        aria-busy="true"
      >
        <p className="sr-only">Carregando telão...</p>
        <PulseBlock className="h-[22vmin] w-[46vw] rounded-[2vw]" />
      </main>
    );
  }

  if (error || !state) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <h1 className="font-heading text-[length:var(--tv-title)]">
          Telão indisponível
        </h1>
        <p className="text-muted-foreground mt-4 text-[length:var(--tv-subtitle)]">
          {error ?? "Sessão não encontrada."}
        </p>
      </main>
    );
  }

  const { session, stations, waiting_count, waiting_codes } = state;
  const called = pickHighlightedCall(stations);
  const draft = session.status === "DRAFT";
  const finished =
    session.status === "FINISHED" || session.status === "CANCELLED";
  const showJoinQr = session.status === "OPEN";
  const showWaiting =
    session.show_waiting_queue_on_tv && waiting_codes.length > 0;

  return (
    <main className="tv-shell">
      <header className="tv-header">
        <div className="flex min-w-0 items-center gap-4">
          <BrandMark compact className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <p className="tv-kicker">{session.church_name}</p>
            <h1 className="font-heading tv-title truncate">{session.name}</h1>
          </div>
        </div>
        <p className="tv-status shrink-0">
          {sessionStatusLabel[session.status]}
        </p>
      </header>

      <section className="tv-hero">
        {finished ? (
          <>
            <p className="tv-hero-label">Sessão encerrada</p>
            <p className="font-heading tv-hero-code text-foreground">
              Obrigado
            </p>
          </>
        ) : draft ? (
          <>
            <p className="tv-hero-label">A fila ainda não foi aberta</p>
            <p className="font-heading tv-hero-code text-primary/25">Aa</p>
            <p className="tv-hero-label">Aguarde a equipe da paróquia</p>
          </>
        ) : called ? (
          <>
            <p className="tv-hero-label">Chamando agora</p>
            <p
              key={`${called.current_public_code}-${called.status}`}
              className={cn(
                "font-heading tv-hero-code tabular-nums",
                called.status === "CALLING" ? "tv-call-pop" : "text-primary",
              )}
            >
              {called.current_public_code}
            </p>
            <p className="tv-hero-station">{called.name}</p>
            <p className="tv-hero-label">
              {called.status === "BUSY" ? "Em atendimento" : "Dirija-se agora"}
            </p>
          </>
        ) : (
          <>
            <p className="tv-hero-label">Aguardando chamada</p>
            <p className="font-heading tv-hero-code text-primary/20">Aa</p>
            <p className="tv-hero-label">
              {waiting_count === 0
                ? "Fila vazia no momento"
                : formatCounted(waiting_count, {
                    one: "pessoa aguardando",
                    other: "pessoas aguardando",
                  })}
            </p>
          </>
        )}
      </section>

      <aside className="tv-side">
        <section className="tv-stations" aria-label="Confessionários">
          {stations.map((station) => {
            const highlighted = called?.id === station.id;
            return (
              <article
                key={station.id}
                className={cn("tv-station", highlighted && "tv-station-active")}
              >
                <div className="tv-station-top">
                  <h2 className="tv-station-name">{station.name}</h2>
                  <span className="tv-station-status">
                    {stationStatusLabel[station.status]}
                  </span>
                </div>
                <p
                  className={cn(
                    "font-heading tv-station-code tabular-nums",
                    station.status === "CALLING" && "tv-station-code-call",
                  )}
                >
                  {station.current_public_code ?? "·"}
                </p>
                {station.priest_name ? (
                  <p className="tv-station-priest">{station.priest_name}</p>
                ) : null}
              </article>
            );
          })}
        </section>

        {showWaiting ? (
          <section className="tv-waiting">
            <p className="tv-kicker">Próximas senhas</p>
            <p className="tv-waiting-codes">
              {waiting_codes.slice(0, 16).join(" · ")}
            </p>
          </section>
        ) : null}

        {showJoinQr ? (
          <aside className="tv-join mt-auto" aria-label="Entrar na fila">
            <QrImage
              url={sessionPublicUrl(session.slug)}
              alt={`QR Code da sessão ${session.slug}`}
              width={200}
              className="tv-join-qr"
            />
            <p className="tv-join-label">Sem papel? Aponte a câmera</p>
          </aside>
        ) : null}
      </aside>
    </main>
  );
}

function pickHighlightedCall(stations: PublicStationState[]) {
  const calling = stations.find(
    (station) => station.status === "CALLING" && station.current_public_code,
  );
  if (calling) return calling;

  return (
    stations.find(
      (station) => station.status === "BUSY" && station.current_public_code,
    ) ?? null
  );
}
