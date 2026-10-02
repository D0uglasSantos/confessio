import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteFooter({ extra }: { extra?: string }) {
  return (
    <footer className="border-border/80 text-muted-foreground flex flex-col gap-4 border-t py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
      <BrandMark tagline />
      <div className="flex max-w-xl flex-col gap-2 sm:items-end sm:text-right">
        {extra ? <p>{extra}</p> : null}
        <nav className="flex flex-wrap gap-3 sm:justify-end">
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            Privacidade
          </Link>
          <Link href="/contato" className="underline-offset-4 hover:underline">
            Contato
          </Link>
        </nav>
      </div>
    </footer>
  );
}
