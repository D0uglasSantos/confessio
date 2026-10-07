import Link from "next/link";

import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";
import { BrandMark } from "@/components/brand-mark";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 sm:px-6">
      <Link href="/admin/login" className="mb-8 w-fit">
        <BrandMark />
      </Link>
      <h1 className="font-heading text-3xl tracking-tight">Esqueci a senha</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        Enviamos um link para o e-mail do administrador cadastrado no Supabase
        Auth.
      </p>
      <div className="mt-8 space-y-6">
        <ForgotPasswordForm />
        <Link
          href="/admin/login"
          className="text-muted-foreground block text-sm underline-offset-4 hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
