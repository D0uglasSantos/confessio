"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { mapQueueError } from "@/lib/queue/errors";
import type { StationState } from "@/lib/queue/types";
import { createAnonClient } from "@/lib/supabase/anon";

type PriestActionsProps = {
  stationId: string;
  accessToken: string;
  state: StationState;
  onDone: () => Promise<void>;
};

const primaryBtn =
  "h-16 min-h-16 w-full touch-manipulation text-lg font-semibold active:scale-[0.99]";
const secondaryBtn =
  "h-12 min-h-12 w-full touch-manipulation text-base active:scale-[0.99]";

export function PriestActions({
  stationId,
  accessToken,
  state,
  onDone,
}: PriestActionsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    actionKey: string;
    title: string;
    description: string;
    confirmLabel: string;
    pendingLabel: string;
    successLabel: string;
    action: () => Promise<{ error: { message: string } | null }>;
  } | null>(null);
  const lock = useInFlightLock();
  const pending = pendingAction !== null;

  const { station, current_ticket: ticket, waiting_count } = state;
  const status = station.status;

  function run(
    actionKey: string,
    label: string,
    action: () => Promise<{ error: { message: string } | null }>,
    options?: {
      title: string;
      description: string;
      confirmLabel: string;
      pendingLabel: string;
    },
  ) {
    if (options) {
      setConfirm({
        actionKey,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel,
        pendingLabel: options.pendingLabel,
        successLabel: label,
        action,
      });
      return;
    }

    execute(actionKey, label, action);
  }

  function execute(
    actionKey: string,
    label: string,
    action: () => Promise<{ error: { message: string } | null }>,
  ) {
    if (!lock.tryAcquire()) return;

    setPendingAction(actionKey);
    startTransition(async () => {
      try {
        setError(null);
        const { error: rpcError } = await action();

        if (rpcError) {
          const message = mapQueueError(
            rpcError.message,
            "Não foi possível concluir a ação.",
          );
          setError(message);
          toast.error(message);
          return;
        }

        toast.success(label);
        setConfirm(null);
        await onDone();
      } finally {
        setPendingAction(null);
        lock.release();
      }
    });
  }

  const auth = { p_station_id: stationId, p_access_token: accessToken };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}

      {status === "AVAILABLE" ? (
        <div className="grid gap-3">
          <Button
            type="button"
            size="lg"
            className={primaryBtn}
            loading={pendingAction === "call"}
            disabled={pending || waiting_count === 0}
            onClick={() =>
              run("call", "Próxima senha chamada", async () =>
                createAnonClient().rpc("call_next_ticket", auth),
              )
            }
          >
            {waiting_count === 0
              ? "Fila vazia"
              : pendingAction === "call"
                ? "Chamando..."
                : `Chamar próximo (${waiting_count})`}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="ghost"
            className={secondaryBtn}
            loading={pendingAction === "pause"}
            disabled={pending}
            onClick={() =>
              run("pause", "Confessionário pausado", async () =>
                createAnonClient().rpc("pause_station", auth),
              )
            }
          >
            {pendingAction === "pause" ? "Pausando..." : "Pausar"}
          </Button>
        </div>
      ) : null}

      {status === "CALLING" && ticket ? (
        <div className="grid gap-3">
          <Button
            type="button"
            size="lg"
            className={primaryBtn}
            loading={pendingAction === "start"}
            disabled={pending}
            onClick={() =>
              run("start", "Atendimento iniciado", async () =>
                createAnonClient().rpc("start_service", {
                  ...auth,
                  p_ticket_id: ticket.id,
                }),
              )
            }
          >
            {pendingAction === "start" ? "Iniciando..." : "Iniciar atendimento"}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className={secondaryBtn}
              loading={pendingAction === "recall"}
              disabled={pending}
              onClick={() =>
                run("recall", "Senha chamada novamente", async () =>
                  createAnonClient().rpc("recall_ticket", {
                    ...auth,
                    p_ticket_id: ticket.id,
                  }),
                )
              }
            >
              {pendingAction === "recall" ? "Chamando..." : "Rechamar"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="danger-ghost"
              className={secondaryBtn}
              loading={pendingAction === "noshow"}
              disabled={pending}
              onClick={() =>
                run(
                  "noshow",
                  "Marcado como não compareceu",
                  async () =>
                    createAnonClient().rpc("mark_no_show", {
                      ...auth,
                      p_ticket_id: ticket.id,
                    }),
                  {
                    title: "Marcar ausência?",
                    description:
                      "A senha será marcada como não compareceu e o confessionário volta a ficar disponível.",
                    confirmLabel: "Confirmar ausência",
                    pendingLabel: "Registrando...",
                  },
                )
              }
            >
              {pendingAction === "noshow" ? "Registrando..." : "Ausente"}
            </Button>
          </div>
        </div>
      ) : null}

      {status === "BUSY" && ticket ? (
        <Button
          type="button"
          size="lg"
          className={primaryBtn}
          loading={pendingAction === "finish"}
          disabled={pending}
          onClick={() =>
            run(
              "finish",
              "Atendimento finalizado",
              async () =>
                createAnonClient().rpc("finish_service", {
                  ...auth,
                  p_ticket_id: ticket.id,
                }),
              {
                title: "Finalizar atendimento?",
                description: "Confirma que esta senha já foi atendida.",
                confirmLabel: "Finalizar",
                pendingLabel: "Finalizando...",
              },
            )
          }
        >
          {pendingAction === "finish" ? "Finalizando..." : "Finalizar atendimento"}
        </Button>
      ) : null}

      {status === "PAUSED" ? (
        <Button
          type="button"
          size="lg"
          className={primaryBtn}
          loading={pendingAction === "resume"}
          onClick={() =>
            run("resume", "Confessionário retomado", async () =>
              createAnonClient().rpc("resume_station", auth),
            )
          }
        >
          {pendingAction === "resume" ? "Retomando..." : "Retomar"}
        </Button>
      ) : null}

      {status === "OFFLINE" ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
          Este confessionário está offline. Peça à equipe para ativá-lo.
        </p>
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(null);
        }}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Confirmar"}
        pendingLabel={confirm?.pendingLabel}
        pending={pending}
        touch
        onConfirm={() => {
          if (!confirm) return;
          const next = confirm;
          execute(next.actionKey, next.successLabel, next.action);
        }}
      />
    </div>
  );
}
