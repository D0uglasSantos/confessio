"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import {
  removeStationAction,
  updateStationAction,
} from "@/app/admin/actions";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stationStatusLabel } from "@/lib/admin/labels";
import type { StationStatus } from "@/lib/admin/metrics";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";

export function SessionStationCard({
  sessionId,
  station,
  priestUrl,
  printHref,
  sessionOpen,
}: {
  sessionId: string;
  station: {
    id: string;
    name: string;
    priest_name: string | null;
    status: StationStatus;
  };
  priestUrl: string | null;
  printHref: string;
  sessionOpen: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();
  const busy = station.status === "CALLING" || station.status === "BUSY";

  function save(formData: FormData) {
    formData.set("sessionId", sessionId);
    formData.set("stationId", station.id);
    startTransition(async () => {
      const result = await updateStationAction(null, formData);
      if (result.ok) {
        toast.success(result.message ?? "Confessionário atualizado.");
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function remove() {
    if (!lock.tryAcquire()) return;
    startTransition(async () => {
      try {
        const result = await removeStationAction(sessionId, station.id);
        if (result.ok) {
          toast.success(result.message ?? "Confessionário removido.");
          setConfirmOpen(false);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } finally {
        lock.release();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-medium">{station.name}</p>
        <p className="text-muted-foreground text-sm">
          {station.priest_name || "Sacerdote não informado"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {sessionOpen ? (
          <Badge
            variant="outline"
            title={
              station.status === "OFFLINE"
                ? "Sacerdote ainda não conectou"
                : undefined
            }
          >
            {stationStatusLabel[station.status] ?? station.status}
          </Badge>
        ) : (
          <span
            className="text-muted-foreground text-xs"
            title="Sacerdote ainda não conectou"
          >
            Aguardando abertura
          </span>
        )}
        {priestUrl ? (
          <>
            <a
              href={priestUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Abrir painel
            </a>
            <CopyLinkButton url={priestUrl} label="Copiar link" variant="ghost" />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Token de acesso ainda não disponível.
          </p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label={`Mais ações de ${station.name}`}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {priestUrl ? (
              <DropdownMenuItem
                onClick={() =>
                  window.open(printHref, "_blank", "noopener,noreferrer")
                }
              >
                Imprimir cartão
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
            >
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form action={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Editar confessionário</DialogTitle>
              <DialogDescription>
                Atualize o nome do posto ou do sacerdote.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`station-name-${station.id}`}>Nome</Label>
              <Input
                id={`station-name-${station.id}`}
                name="name"
                defaultValue={station.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`station-priest-${station.id}`}>Sacerdote</Label>
              <Input
                id={`station-priest-${station.id}`}
                name="priestName"
                defaultValue={station.priest_name ?? ""}
              />
            </div>
            <DialogFooter>
              <Button type="submit" loading={pending}>
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {station.name}?</DialogTitle>
            <DialogDescription>
              O cartão de mesa e o link do padre deste posto deixam de valer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={pending}
              onClick={remove}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
