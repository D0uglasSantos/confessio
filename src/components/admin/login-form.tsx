"use client";

import { useActionState } from "react";

import { signInAdmin, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult | null = null;

export function LoginForm({ errorHint }: { errorHint?: string }) {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {(errorHint || (state && !state.ok)) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorHint === "sem-permissao"
            ? "Este usuário não é administrador da paróquia."
            : state && !state.ok
              ? state.message
              : null}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue="admin@paroquia.local"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue="admin123"
          required
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Ambiente local: admin@paroquia.local / admin123
      </p>
    </form>
  );
}
