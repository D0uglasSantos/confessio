"use client";

import { useState } from "react";

import { RescheduleSessionForm } from "@/components/admin/reschedule-session-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RescheduleSessionDialog({
  sessionId,
  startsAt,
  endsAt,
  pastDraft,
}: {
  sessionId: string;
  startsAt: string | null;
  endsAt: string | null;
  pastDraft?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div id="reagendar">
      <Button
        type="button"
        variant="link"
        className="h-auto px-0 text-sm"
        onClick={() => setOpen(true)}
      >
        {pastDraft ? "Reagendar horário" : "Editar horário"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pastDraft ? "Horário já passou" : "Editar horário"}
            </DialogTitle>
            <DialogDescription>
              {pastDraft
                ? "Reagende o rascunho antes de abrir a fila."
                : "Ajuste início e término previstos."}
            </DialogDescription>
          </DialogHeader>
          <RescheduleSessionForm
            sessionId={sessionId}
            startsAt={startsAt}
            endsAt={endsAt}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
