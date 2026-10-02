"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  rescheduleSessionAction,
  type ActionResult,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addHoursToBrazilLocalInput,
  isoToBrazilLocalInput,
  nextFullHourBrazilLocalInput,
} from "@/lib/admin/datetime";

const initialState: ActionResult | null = null;

export function RescheduleSessionForm({
  sessionId,
  startsAt,
  endsAt,
}: {
  sessionId: string;
  startsAt: string | null;
  endsAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    rescheduleSessionAction,
    initialState,
  );
  const defaultStart = startsAt
    ? isoToBrazilLocalInput(startsAt)
    : nextFullHourBrazilLocalInput();
  const defaultEnd = endsAt
    ? isoToBrazilLocalInput(endsAt)
    : addHoursToBrazilLocalInput(defaultStart, 2);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Horário atualizado.");
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="space-y-2">
        <Label htmlFor="reschedule-start">Novo início</Label>
        <Input
          id="reschedule-start"
          name="startsAt"
          type="datetime-local"
          defaultValue={defaultStart}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reschedule-end">Novo término</Label>
        <Input
          id="reschedule-end"
          name="endsAt"
          type="datetime-local"
          defaultValue={defaultEnd}
          required
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" variant="outline" loading={pending}>
          {pending ? "Salvando..." : "Reagendar"}
        </Button>
      </div>
    </form>
  );
}
