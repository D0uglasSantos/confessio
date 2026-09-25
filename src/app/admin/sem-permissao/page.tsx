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

export default function AdminForbiddenPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Sem permissão</CardTitle>
          <CardDescription>
            Este usuário autenticou, mas não está vinculado a uma paróquia em
            church_admins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Voltar ao início
          </Link>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
