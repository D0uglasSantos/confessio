import Link from "next/link";

import { LoginForm } from "@/components/admin/login-form";
import { BrandMark } from "@/components/brand-mark";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/brand";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = {
  title: "Entrar",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:px-6 sm:py-12">
      <Link href="/" aria-label={APP_NAME} className="mb-8 w-fit">
        <BrandMark tagline />
      </Link>
      <Card className="brand-panel ring-primary/10 border-0 py-6">
        <CardHeader>
          <p className="brand-kicker mb-2">Acesso protegido</p>
          <CardTitle className="font-heading text-4xl font-semibold tracking-[-0.025em]">
            Administração
          </CardTitle>
          <CardDescription className="max-w-sm text-base leading-relaxed">
            Login da secretaria da paróquia e da administração da plataforma.
            Fiel e sacerdote continuam sem conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm errorHint={params.error} />
          <Link
            href="/"
            className="text-primary block text-sm font-medium underline-offset-4 hover:underline"
          >
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
