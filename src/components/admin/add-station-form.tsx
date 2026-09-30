"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { addStationAction, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult | null = null;

export function AddStationForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, pending] = useActionState(
    addStationAction,
    initialState,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Confessionário adicionado.");
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="space-y-2">
        <Label htmlFor="station-name">Nome</Label>
        <Input id="station-name" name="name" placeholder="Confessionário 04" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="priest-name">Sacerdote</Label>
        <Input id="priest-name" name="priestName" placeholder="Pe. Nome" />
      </div>
      <div className="flex items-end">
        <Button type="submit" loading={pending}>
          {pending ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
