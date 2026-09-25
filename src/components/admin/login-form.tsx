"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { signInAdmin, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocalSupabase } from "@/lib/supabase/env";

const initialState: ActionResult | null = null;

export function LoginForm({ errorHint }: { errorHint?: string }) {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const localDev = isLocalSupabase();

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
          defaultValue={localDev ? "admin@paroquia.local" : undefined}
          placeholder={localDev ? undefined : "e-mail do Auth no Supabase"}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            defaultValue={localDev ? "admin123" : undefined}
            className="pr-9"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/admin/esqueci-senha"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          Esqueci a senha
        </Link>
      </p>

      <p className="text-xs text-muted-foreground">
        {localDev
          ? "Ambiente local: admin@paroquia.local / admin123"
          : "Use o e-mail e a senha do usuário criado em Authentication → Users. O seed local não existe no cloud."}
      </p>
    </form>
  );
}
