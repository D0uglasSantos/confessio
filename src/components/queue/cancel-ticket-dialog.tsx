"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mapQueueError } from "@/lib/queue/errors";
import { createAnonClient } from "@/lib/supabase/anon";

export function CancelTicketDialog({
  token,
  onCancelled,
}: {
  token: string;
  onCancelled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();

  function cancel() {
    if (!lock.tryAcquire()) return;

    startTransition(async () => {
      try {
        const supabase = createAnonClient();
        const { error } = await supabase.rpc("cancel_ticket", {
          p_token: token,
        });

        if (error) {
          toast.error(
            mapQueueError(
              error.message,
              "Não foi possível sair da fila.",
            ),
          );
          return;
        }

        toast.success("Você saiu da fila.");
        setOpen(false);
        onCancelled();
      } finally {
        lock.release();
      }
    });
  }

  const busy = pending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="h-14 w-full touch-manipulation text-base"
            size="lg"
            disabled={busy}
          />
        }
      >
        Sair da fila
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sair da fila?</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Sua senha será cancelada. Se quiser confessar depois, precisará
            entrar novamente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="h-12 touch-manipulation"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Continuar na fila
          </Button>
          <Button
            variant="destructive"
            className="h-12 touch-manipulation"
            disabled={busy}
            onClick={cancel}
          >
            {pending ? "Saindo..." : "Confirmar saída"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
