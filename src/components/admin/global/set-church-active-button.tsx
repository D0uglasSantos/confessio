"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setChurchActiveAction } from "@/app/admin/global/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";

export function SetChurchActiveButton({
  churchId,
  churchName,
  isActive,
  hasActiveSession,
  inMenu = false,
}: {
  churchId: string;
  churchName: string;
  isActive: boolean;
  hasActiveSession: boolean;
  inMenu?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();

  function run(nextActive: boolean) {
    if (!lock.tryAcquire()) return;
    startTransition(async () => {
      try {
        const result = await setChurchActiveAction(churchId, nextActive);
        if (result.ok) {
          toast.success(result.message);
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } finally {
        lock.release();
      }
    });
  }

  if (!isActive) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending}
        className={inMenu ? "w-full justify-start" : undefined}
        onClick={() => run(true)}
      >
        {pending ? "Reativando..." : "Reativar"}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant={inMenu ? "ghost" : "outline"}
        size="sm"
        disabled={hasActiveSession}
        className={inMenu ? "text-destructive w-full justify-start" : undefined}
        title={
          hasActiveSession
            ? "Encerre as sessões ativas antes de desativar."
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        Desativar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar {churchName}?</DialogTitle>
            <DialogDescription>
              A secretaria deixa de criar e abrir sessões. O histórico da fila
              permanece. Fiéis, TV e painel do padre das sessões já encerradas
              não voltam a operar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={pending}
              onClick={() => run(false)}
            >
              Desativar paróquia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
