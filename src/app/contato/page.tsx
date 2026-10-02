import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ContactForm } from "@/components/contact-form";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Contato",
  description: "Leve o Confessio para a sua paróquia.",
};

export default function ContactPage() {
  const to =
    process.env.CONFESSIO_CONTACT_EMAIL?.trim() || "contatoconfessio@gmail.com";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <BrandMark />
        <Link
          href="/admin/login"
          className={buttonVariants({ variant: "outline" })}
        >
          Administração
        </Link>
      </header>
      <section className="py-12">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Quero levar para minha paróquia
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-lg">
          Conte em qual comunidade vocês querem organizar a fila de confissão.
          Respondemos por e-mail.
        </p>
        <div className="mt-8 max-w-md">
          <ContactForm to={to} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
