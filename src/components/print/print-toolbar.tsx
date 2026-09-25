"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="print-toolbar">
      <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
        Voltar à sessão
      </Link>
      <Button type="button" onClick={() => window.print()}>
        Imprimir
      </Button>
    </div>
  );
}

export function PrintAuto() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 400);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
