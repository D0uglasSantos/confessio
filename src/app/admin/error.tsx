"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-12">
      <h1 className="font-heading text-3xl">Não foi possível abrir o admin</h1>
      <p className="text-sm text-muted-foreground">
        A sessão pode ter expirado. Recarregue o painel ou entre de novo.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonVariants()}
          onClick={() => reset()}
        >
          Tentar de novo
        </button>
        <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
          Abrir painel
        </Link>
        <Link
          href="/admin/login"
          className={buttonVariants({ variant: "outline" })}
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
