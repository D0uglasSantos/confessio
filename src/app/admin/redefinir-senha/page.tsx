import Link from "next/link";

import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Nova senha</CardTitle>
          <CardDescription>
            Defina a senha do administrador depois de abrir o link do e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResetPasswordForm hasSession={Boolean(user)} />
          <Link
            href="/admin/esqueci-senha"
            className="block text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Pedir um novo link
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
