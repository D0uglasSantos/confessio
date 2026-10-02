"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { adminSignInMessage } from "@/lib/admin/sign-in-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocalSupabase } from "@/lib/supabase/env";

const LOGIN_ERRORS: Record<string, string> = {
  "sem-permissao": adminSignInMessage("forbidden"),
  "reset-link":
    "O link de recuperação expirou ou é inválido. Peça outro em Esqueci a senha.",
  missing: adminSignInMessage("missing"),
  credentials: adminSignInMessage("credentials"),
  unconfirmed: adminSignInMessage("unconfirmed"),
  forbidden: adminSignInMessage("forbidden"),
  config: adminSignInMessage("config"),
  unexpected: adminSignInMessage("unexpected"),
};

function SubmitButton({ submitting }: { submitting: boolean }) {
  const { pending } = useFormStatus();
  const loading = pending || submitting;

  return (
    <Button type="submit" className="w-full" size="lg" loading={loading}>
      {loading ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm({ errorHint }: { errorHint?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const localDev = isLocalSupabase();
  const errorMessage = errorHint
    ? (LOGIN_ERRORS[errorHint] ?? LOGIN_ERRORS.unexpected)
    : null;

  return (
    <form
      action="/api/admin/login"
      method="post"
      className="space-y-4"
      aria-busy={submitting}
      onSubmit={(event) => {
        if (!event.currentTarget.checkValidity()) return;
        // Keep named fields enabled so the native POST still sends them.
        queueMicrotask(() => setSubmitting(true));
      }}
    >
      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          defaultValue={localDev ? "admin@paroquia.local" : undefined}
          placeholder={localDev ? undefined : "E-mail da secretaria"}
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

      <SubmitButton submitting={submitting} />

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
          ? "Ambiente local: secretaria admin@paroquia.local / admin123 · plataforma global@plataforma.local / global123"
          : process.env.NODE_ENV !== "production"
            ? "Use o e-mail e a senha do usuário criado em Authentication → Users. O seed local não existe no cloud."
            : "Problemas para entrar? Fale com a administração da plataforma."}
      </p>
    </form>
  );
}
