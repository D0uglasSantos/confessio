import Link from "next/link";

import { SignOutButton } from "@/components/admin/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminGlobalForbiddenPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">
            Sem permissão
          </CardTitle>
          <CardDescription>
            Este usuário já tem login, mas não tem acesso ao painel da
            plataforma. Apenas administradores globais podem entrar aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
            Ir para o admin da paróquia
          </Link>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
