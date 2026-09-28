"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createChurchAction,
  type CreateChurchResult,
} from "@/app/admin/global/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateChurchResult | null = null;

export function CreateChurchForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createChurchAction,
    initialState,
  );

  useEffect(() => {
    if (!state) return;

    if (state.ok) {
      toast.success("Paróquia cadastrada.");
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="church-name">Nome da paróquia</Label>
        <Input
          id="church-name"
          name="name"
          placeholder="Paróquia Nossa Senhora de Fátima"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="church-slug">Slug</Label>
        <Input
          id="church-slug"
          name="slug"
          placeholder="nossa-senhora-de-fatima"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="church-logo">Logo (URL, opcional)</Label>
        <Input
          id="church-logo"
          name="logoUrl"
          type="url"
          placeholder="https://..."
        />
      </div>
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Cadastrando..." : "Cadastrar paróquia"}
        </Button>
      </div>
    </form>
  );
}
