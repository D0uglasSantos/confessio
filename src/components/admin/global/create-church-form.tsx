"use client";

import { useActionState, useEffect, useRef } from "react";
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

export function CreateChurchForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const [state, formAction, pending] = useActionState(
    createChurchAction,
    initialState,
  );

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!state) return;

    if (state.ok) {
      toast.success("Paróquia cadastrada.");
      formRef.current?.reset();
      onSuccessRef.current?.();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
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
        <p className="text-muted-foreground text-xs">
          Identifica a paróquia nas rotas públicas.
        </p>
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
      <Button type="submit" loading={pending}>
        {pending ? "Cadastrando..." : "Cadastrar paróquia"}
      </Button>
    </form>
  );
}
