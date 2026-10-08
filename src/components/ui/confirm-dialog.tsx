"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancelar",
  confirmLabel,
  pendingLabel,
  pending = false,
  confirmVariant = "destructive",
  touch = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  confirmVariant?: "destructive" | "default";
  touch?: boolean;
  onConfirm: () => void;
}) {
  const buttonClass = touch ? "h-12 touch-manipulation" : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className={touch ? "max-w-[calc(100%-1.5rem)] sm:max-w-sm" : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={touch ? "text-base leading-relaxed" : undefined}>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className={buttonClass}
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className={buttonClass}
            loading={pending}
            onClick={onConfirm}
          >
            {pending ? pendingLabel ?? confirmLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
