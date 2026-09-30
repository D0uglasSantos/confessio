"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  closeEntryAction,
  finishSessionAction,
  openSessionAction,
  toggleWaitingQueueOnTvAction,
} from "@/app/admin/actions";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import type { Database } from "@/types/database";

type SessionStatus = Database["public"]["Enums"]["session_status"];
type PendingAction = "open" | "close" | "finish" | "tv" | null;

export function SessionLifecycleActions({
  sessionId,
  status,
  showWaitingQueueOnTv,
}: {
  sessionId: string;
  status: SessionStatus;
  showWaitingQueueOnTv: boolean;
}) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [, startTransition] = useTransition();
  const [tvEnabled, setTvEnabled] = useState(showWaitingQueueOnTv);
  const lock = useInFlightLock();
  const busy = pendingAction !== null;

  useEffect(() => {
    if (pendingAction === null) {
      setTvEnabled(showWaitingQueueOnTv);
    }
  }, [pendingAction, showWaitingQueueOnTv]);

  function run(
    actionKey: Exclude<PendingAction, "tv" | null>,
    action: () => Promise<{ ok: boolean; message?: string }>,
    successFallback: string,
  ) {
    if (!lock.tryAcquire()) return;

    setPendingAction(actionKey);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.message ?? "Não foi possível concluir a ação.");
          return;
        }
        toast.success(result.message ?? successFallback);
      } finally {
        setPendingAction(null);
        lock.release();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" ? (
          <Button
            size="lg"
            loading={pendingAction === "open"}
            disabled={busy}
            onClick={() =>
              run("open", () => openSessionAction(sessionId), "Fila aberta.")
            }
          >
            {pendingAction === "open" ? "Abrindo..." : "Abrir fila"}
          </Button>
        ) : null}

        {status === "OPEN" ? (
          <Button
            size="lg"
            variant="secondary"
            loading={pendingAction === "close"}
            disabled={busy}
            onClick={() =>
              run(
                "close",
                () => closeEntryAction(sessionId),
                "Entrada encerrada.",
              )
            }
          >
            {pendingAction === "close" ? "Encerrando..." : "Encerrar entrada"}
          </Button>
        ) : null}

        {status === "OPEN" || status === "ENTRY_CLOSED" ? (
          <Button
            size="lg"
            variant="outline"
            loading={pendingAction === "finish"}
            disabled={busy}
            onClick={() =>
              run(
                "finish",
                async () => {
                  const first = await finishSessionAction(sessionId, false);
                  if (
                    !first.ok &&
                    first.message?.includes("ticket") &&
                    window.confirm(
                      `${first.message}\n\nDeseja encerrar mesmo assim?`,
                    )
                  ) {
                    return finishSessionAction(sessionId, true);
                  }
                  return first;
                },
                "Sessão encerrada.",
              )
            }
          >
            {pendingAction === "finish" ? "Finalizando..." : "Finalizar sessão"}
          </Button>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={tvEnabled}
          disabled={busy}
          onChange={(event) => {
            const next = event.target.checked;
            const previous = tvEnabled;
            setTvEnabled(next);

            if (!lock.tryAcquire()) {
              setTvEnabled(previous);
              return;
            }

            setPendingAction("tv");
            startTransition(async () => {
              try {
                const result = await toggleWaitingQueueOnTvAction(
                  sessionId,
                  next,
                );
                if (!result.ok) {
                  setTvEnabled(previous);
                  toast.error(
                    result.message ?? "Não foi possível atualizar a TV.",
                  );
                  return;
                }
                toast.success(
                  result.message ?? "Preferência da TV atualizada.",
                );
              } finally {
                setPendingAction(null);
                lock.release();
              }
            });
          }}
        />
        {pendingAction === "tv" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
            Salvando...
          </span>
        ) : (
          "Exibir próximas senhas na TV"
        )}
      </label>
    </div>
  );
}
