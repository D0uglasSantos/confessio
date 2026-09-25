import Link from "next/link";

import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">
            Esqueci a senha
          </CardTitle>
          <CardDescription>
            Enviamos um link para o e-mail do administrador cadastrado no
            Supabase Auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ForgotPasswordForm />
          <Link
            href="/admin/login"
            className="block text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Voltar ao login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
