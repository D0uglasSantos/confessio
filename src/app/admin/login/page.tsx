import Image from "next/image";
import Link from "next/link";
import { LockKeyholeIcon } from "lucide-react";

import { LoginForm } from "@/components/admin/login-form";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/brand";

const LOGIN_INTERIOR = "/brand/confessio/login-interior.jpg";

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
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <section className="relative hidden min-h-dvh overflow-hidden lg:flex">
        <Image
          src={LOGIN_INTERIOR}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-[78%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#f4ecdf]/70 via-[#f4ecdf]/10 to-[#f4ecdf]/35"
        />
        <div className="relative z-10 flex w-full flex-col justify-between px-12 py-12">
          <BrandMark lockup />
          <div className="max-w-md">
            <p className="brand-kicker">Confessio</p>
            <h1 className="font-heading mt-4 text-5xl leading-[1.05] font-semibold tracking-[-0.03em]">
              Menos espera. Mais serenidade.
            </h1>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              A secretaria organiza a fila. Fiel e sacerdote entram sem conta.
            </p>
          </div>
          <p className="text-muted-foreground text-sm">{APP_NAME}</p>
        </div>
      </section>

      <section className="relative flex flex-1 flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <Image
            src={LOGIN_INTERIOR}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[80%_20%] opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/92 to-background" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="text-muted-foreground mb-10 inline-block text-sm underline-offset-4 hover:underline lg:hidden"
          >
            Voltar ao início
          </Link>
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <div className="flex items-center gap-2">
            <LockKeyholeIcon className="text-muted-foreground size-4" aria-hidden />
            <h2 className="font-heading text-3xl tracking-tight">Administração</h2>
          </div>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Login da secretaria da paróquia e da administração da plataforma.
          </p>
          <div className="mt-8">
            <LoginForm errorHint={params.error} />
          </div>
          <Link
            href="/"
            className="text-muted-foreground mt-8 hidden text-sm underline-offset-4 hover:underline lg:inline-block"
          >
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
