"use client";

import { useActionState } from "react";

import {
  requestPasswordReset,
  type ActionResult,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult | null = null;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state ? (
        <p
          className={
            state.ok
              ? "rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="e-mail do Auth no Supabase"
          required
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
