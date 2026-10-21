"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { issuePaperTicketsAction } from "@/app/admin/actions";
import { formatCounted } from "@/lib/admin/format";
import { startNavigationProgress } from "@/components/navigation-progress";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { formatPublicCode } from "@/lib/queue/ticket";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAPER_TICKET_MAX,
  PAPER_TICKET_MIN,
  PAPER_TICKET_PRESETS,
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
  const [count, setCount] = useState("50");
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();
  const parsedCount = Number(count);
  const countIsValid =
    Number.isInteger(parsedCount) &&
    parsedCount >= PAPER_TICKET_MIN &&
    parsedCount <= PAPER_TICKET_MAX;

  function issue() {
    if (!countIsValid || !lock.tryAcquire()) return;

    startTransition(async () => {
      try {
        const result = await issuePaperTicketsAction(sessionId, parsedCount);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(
          `${formatCounted(parsedCount, { one: "senha pronta", other: "senhas prontas" })} para imprimir.`,
        );
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
        <Input
          id="paper-ticket-count"
          type="number"
          inputMode="numeric"
          min={PAPER_TICKET_MIN}
          max={PAPER_TICKET_MAX}
          step={1}
          value={count}
          disabled={disabled || pending}
          aria-invalid={!countIsValid}
          aria-describedby="paper-ticket-count-hint"
          className="max-w-xs"
          onChange={(event) => setCount(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {PAPER_TICKET_PRESETS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={parsedCount === value ? "default" : "outline"}
              disabled={disabled || pending}
              onClick={() => setCount(String(value))}
            >
              {value}
            </Button>
          ))}
        </div>
        <p id="paper-ticket-count-hint" className="text-muted-foreground text-xs">
          {countIsValid
            ? "Escolha um atalho ou digite qualquer quantidade de 1 a 500."
            : "Informe um número inteiro de 1 a 500."}
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        loading={pending}
        disabled={disabled || !countIsValid}
        title={
          disabled ? "Disponível depois de abrir a fila" : undefined
        }
        onClick={issue}
      >
        {pending
          ? "Gerando senhas..."
          : countIsValid
            ? `Imprimir ${formatCounted(parsedCount, { one: "senha", other: "senhas" })}`
            : "Imprimir senhas"}
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