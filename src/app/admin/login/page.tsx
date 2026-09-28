import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Administração</CardTitle>
          <CardDescription>
            Login da secretaria da paróquia e da administração da plataforma.
            Fiel e sacerdote continuam sem conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm errorHint={params.error} />
          <Link
            href="/"
            className="block text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
