"use client";

import { useActionState } from "react";

import { updateAdminPassword, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult | null = null;

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState(
    updateAdminPassword,
    initialState,
  );

  if (!hasSession) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Link expirado ou incompleto. Peça um novo e-mail em Esqueci a senha.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <p className="text-muted-foreground text-xs">
          Use pelo menos 10 caracteres.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </div>

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
