import Link from "next/link";

import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  let user = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } catch {
    user = null;
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 sm:px-6">
      <Link href="/admin/login" className="mb-8 w-fit">
        <BrandMark />
      </Link>
      <h1 className="font-heading text-3xl tracking-tight">Nova senha</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        Defina a senha do administrador depois de abrir o link do e-mail.
      </p>
      <div className="mt-8 space-y-6">
        <ResetPasswordForm hasSession={Boolean(user)} />
        <Link
          href="/admin/esqueci-senha"
          className="text-muted-foreground block text-sm underline-offset-4 hover:underline"
        >
          Pedir um novo link
        </Link>
      </div>
    </main>
  );
}
