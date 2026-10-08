"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  closeEntryAction,
  finishSessionAction,
  openSessionAction,
  toggleWaitingQueueOnTvAction,
} from "@/app/admin/actions";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2Icon } from "lucide-react";
import type { Database } from "@/types/database";

type SessionStatus = Database["public"]["Enums"]["session_status"];
type PendingAction = "open" | "close" | "finish" | "tv" | null;

export function SessionLifecycleActions({
  sessionId,
  status,
  showWaitingQueueOnTv,
  mode = "all",
}: {
  sessionId: string;
  status: SessionStatus;
  showWaitingQueueOnTv: boolean;
  mode?: "all" | "primary" | "tv";
}) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [, startTransition] = useTransition();
  const [tvOverride, setTvOverride] = useState<boolean | null>(null);
  const [forceFinishMessage, setForceFinishMessage] = useState<string | null>(
    null,
  );
  const lock = useInFlightLock();
  const busy = pendingAction !== null;
  const tvEnabled = tvOverride ?? showWaitingQueueOnTv;

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

  function finishSession(force: boolean) {
    if (!lock.tryAcquire()) return;

    setPendingAction("finish");
    startTransition(async () => {
      try {
        const result = await finishSessionAction(sessionId, force);
        if (
          !force &&
          !result.ok &&
          result.message?.includes("senha")
        ) {
          setForceFinishMessage(result.message);
          return;
        }
        if (!result.ok) {
          toast.error(result.message ?? "Não foi possível concluir a ação.");
          return;
        }
        setForceFinishMessage(null);
        toast.success(result.message ?? "Sessão encerrada.");
      } finally {
        setPendingAction(null);
        lock.release();
      }
    });
  }

  const showPrimary = mode !== "tv";
  const showTv = mode !== "primary";

  return (
    <div className="flex flex-col gap-3">
      {showPrimary ? (
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
              variant="danger-ghost"
              loading={pendingAction === "finish" && !forceFinishMessage}
              disabled={busy && !forceFinishMessage}
              onClick={() => finishSession(false)}
            >
              {pendingAction === "finish" && !forceFinishMessage
                ? "Finalizando..."
                : "Encerrar sessão"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {showTv ? (
        <div className="flex items-start justify-between gap-3 py-1">
          <div className="min-w-0">
            <p className="text-sm font-medium">Exibir próximas senhas na TV</p>
            <p className="text-muted-foreground text-xs">
              {pendingAction === "tv" ? "Salvando..." : "Salva automaticamente"}
            </p>
          </div>
          {pendingAction === "tv" ? (
            <Loader2Icon className="text-muted-foreground mt-1 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Switch
              checked={tvEnabled}
              disabled={busy}
              aria-label="Exibir próximas senhas na TV"
              onCheckedChange={(next) => {
                const previous = tvEnabled;
                setTvOverride(next);

                if (!lock.tryAcquire()) {
                  setTvOverride(previous);
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
                      setTvOverride(previous);
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
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={forceFinishMessage !== null}
        onOpenChange={(open) => {
          if (!open) setForceFinishMessage(null);
        }}
        title="Encerrar sessão?"
        description={`${(forceFinishMessage ?? "").replace(/\s*Confirme para forçar o encerramento\.?/, "").trim()} As pessoas que ainda aguardam deixam de ser chamadas.`}
        cancelLabel="Cancelar"
        confirmLabel="Encerrar mesmo assim"
        pendingLabel="Encerrando..."
        pending={pendingAction === "finish"}
        onConfirm={() => finishSession(true)}
      />
    </div>
  );
}
