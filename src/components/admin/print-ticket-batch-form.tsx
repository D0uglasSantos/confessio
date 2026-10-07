"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { issuePaperTicketsAction } from "@/app/admin/actions";
import { startNavigationProgress } from "@/components/navigation-progress";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { formatPublicCode } from "@/lib/queue/ticket";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PAPER_TICKET_COUNTS,
  type PaperTicketCount,
} from "@/lib/validations/session";

type PrintBatchSummary = {
  id: string;
  ticket_count: number;
  first_public_number: number;
  last_public_number: number;
  created_at: string;
};

export function PrintTicketBatchForm({
  sessionId,
  ticketPrefix,
  disabled,
  batches,
}: {
  sessionId: string;
  ticketPrefix: string;
  disabled?: boolean;
  batches: PrintBatchSummary[];
}) {
  const [count, setCount] = useState<PaperTicketCount>(50);
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();

  function issue() {
    if (!lock.tryAcquire()) return;

    startTransition(async () => {
      try {
        const result = await issuePaperTicketsAction(sessionId, count);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(`${count} senhas prontas para imprimir.`);
        const printUrl = `/admin/sessoes/${sessionId}/imprimir/lote/${result.batchId}`;
        const opened = window.open(printUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
          startNavigationProgress();
          window.location.href = printUrl;
        }
      } finally {
        lock.release();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="paper-ticket-count">Quantidade de senhas</Label>
        <select
          id="paper-ticket-count"
          className="border-input bg-background h-10 w-full max-w-xs rounded-lg border px-3 text-sm"
          value={count}
          disabled={disabled || pending}
          onChange={(event) =>
            setCount(Number(event.target.value) as PaperTicketCount)
          }
        >
          {PAPER_TICKET_COUNTS.map((value) => (
            <option key={value} value={value}>
              {value} senhas
            </option>
          ))}
        </select>
      </div>

      <Button
        type="button"
        variant="secondary"
        loading={pending}
        disabled={disabled}
        title={
          disabled ? "Disponível depois de abrir a fila" : undefined
        }
        onClick={issue}
      >
        {pending ? "Gerando senhas..." : `Imprimir ${count} senhas`}
      </Button>

      <p className="text-sm text-muted-foreground">
        {disabled
          ? "Disponível depois de abrir a fila. Use o papel para quem chega sem celular."
          : "Cada papel leva o título da sessão, a senha e um QR próprio. Entregue na ordem impressa."}
      </p>

      {batches.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Lotes já gerados</p>
          <ul className="space-y-2 text-sm">
            {batches.map((batch) => {
              const range = `${formatPublicCode(ticketPrefix, batch.first_public_number)} – ${formatPublicCode(ticketPrefix, batch.last_public_number)}`;
              return (
                <li
                  key={batch.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-muted-foreground">
                    {batch.ticket_count} senhas · {range}
                  </span>
                  <Link
                    href={`/admin/sessoes/${sessionId}/imprimir/lote/${batch.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Imprimir de novo
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}