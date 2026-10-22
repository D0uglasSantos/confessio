"use client";

import { PulseBlock } from "@/components/loading-state";
import { usePublicSession } from "@/hooks/use-public-session";
import type { PublicSessionState, PublicStationState } from "@/lib/queue/types";
import { cn } from "@/lib/utils";

export function TvBoardClient({ slug }: { slug: string }) {
  const { state, error, isLoading } = usePublicSession(slug);

  if (isLoading) {
    return (
      <main className="tv-shell" aria-busy="true">
        <p className="sr-only">Carregando telão...</p>
        <PulseBlock className="h-full rounded-[1.6vmin]" />
        <PulseBlock className="h-full rounded-[1.6vmin]" />
      </main>
    );
  }

  if (error || !state) {
    return (
      <main className="tv-shell tv-shell-solo">
        <section className="tv-now">
          <p className="tv-now-kicker">Telão</p>
          <h1 className="font-heading tv-now-idle">Indisponível</h1>
          <p className="tv-now-note">{error ?? "Sessão não encontrada."}</p>
        </section>
      </main>
    );
  }

  return <TvBoardView state={state} />;
}

function TvBoardView({ state }: { state: PublicSessionState }) {
  const { session, stations, waiting_codes } = state;
  const calls = visibleCalls(stations);
  const called = calls.find((station) => station.status === "CALLING") ?? null;
  const dense = calls.length >= 7;
  const columns = calls.length >= 11 ? 3 : dense ? 2 : 1;
  const finished =
    session.status === "FINISHED" || session.status === "CANCELLED";
  const draft = session.status === "DRAFT";
  const showWaiting =
    session.show_waiting_queue_on_tv && waiting_codes.length > 0;

  if (finished || draft) {
    return (
      <main className="tv-shell tv-shell-solo">
        <section className="tv-now">
          {finished ? (
            <>
              <p className="tv-now-kicker">Sessão encerrada</p>
              <p className="font-heading tv-now-idle">Obrigado</p>
            </>
          ) : (
            <>
              <p className="tv-now-kicker">Aguarde</p>
              <p className="font-heading tv-now-message">
                A fila ainda não foi aberta
              </p>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="tv-shell" data-dense={dense ? "true" : undefined}>
      <NowCall call={called} />
      <aside className="tv-recent" aria-label="Últimas chamadas">
        <h2 className="tv-recent-title">Últimas chamadas</h2>
        {calls.length === 0 ? (
          <p className="tv-recent-empty">Nenhuma senha chamada</p>
        ) : (
          <div className="tv-calls" data-columns={columns}>
            {calls.map((station) => (
              <article
                key={station.id}
                className={cn(
                  "tv-call",
                  station.status === "CALLING" && "tv-call-live",
                )}
              >
                <p
                  className={cn(
                    "tv-call-code",
                    station.status === "CALLING" && "tv-call-code-live",
                  )}
                >
                  {station.current_public_code}
                  {station.status === "CALLING" ? (
                    <span className="sr-only">, chamando agora</span>
                  ) : null}
                </p>
                <p className="tv-call-place">{station.name}</p>
              </article>
            ))}
          </div>
        )}
        {showWaiting ? (
          <p className="tv-next">
            <span className="tv-next-label">Próximas</span>
            {waiting_codes.slice(0, 8).join("  ·  ")}
          </p>
        ) : null}
      </aside>
    </main>
  );
}

function NowCall({ call }: { call: PublicStationState | null }) {
  if (!call?.current_public_code) {
    return (
      <section className="tv-now" aria-live="polite">
        <div className="tv-now-block">
          <p className="tv-now-kicker">Senha</p>
          <p className="font-heading tv-now-idle">Aguardando</p>
        </div>
      </section>
    );
  }

  return (
    <section className="tv-now" aria-live="assertive">
      <div className="tv-now-block">
        <p className="tv-now-kicker">Senha</p>
        <p
          key={`${call.id}-${call.current_public_code}`}
          className="tv-now-code"
        >
          {call.current_public_code}
        </p>
      </div>
      <div className="tv-now-block">
        <p className="tv-now-kicker">Confessionário</p>
        <p className="font-heading tv-now-place">{call.name}</p>
      </div>
    </section>
  );
}

function visibleCalls(stations: PublicStationState[]) {
  const withCode = stations.filter(
    (station) =>
      Boolean(station.current_public_code) &&
      (station.status === "CALLING" || station.status === "BUSY"),
  );

  return [
    ...withCode.filter((station) => station.status === "CALLING"),
    ...withCode.filter((station) => station.status === "BUSY"),
  ];
}
