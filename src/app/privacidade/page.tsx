import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Privacidade",
  description:
    "O Confessio não pede conta ao fiel e nunca armazena o conteúdo da confissão.",
};

export default function PrivacyPage() {
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
      <article className="space-y-6 py-12">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Privacidade e LGPD
        </h1>
        <p className="text-muted-foreground text-lg leading-8">
          O fiel entra na fila sem conta. Nome, CPF e e-mail não são pedidos.
          Este é o diferencial do Confessio.
        </p>
        <section className="space-y-2">
          <h2 className="font-heading text-2xl">O que não coletamos</h2>
          <p>
            Nome, CPF, e-mail, pecados, motivo da confissão, anotações do
            sacerdote ou qualquer conteúdo da conversa. Tokens privados da senha
            ficam só no aparelho do fiel.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-heading text-2xl">Telefone opcional</h2>
          <p>
            O fiel pode informar um número só para receber aviso de chamada no
            WhatsApp. Esse dado não aparece no telão, na fila pública nem no
            painel do sacerdote. A senha continua sendo o código público, por
            exemplo C-042.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-heading text-2xl">O que a fila usa</h2>
          <p>
            Um código público da senha (por exemplo C-042), a posição na fila e
            o estado do atendimento. Isso basta para chamar no telão e no painel
            do sacerdote.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-heading text-2xl">Administração</h2>
          <p>
            A secretaria da paróquia e a administração da plataforma entram com
            e-mail e senha. Esses dados pertencem à operação da paróquia, não ao
            fiel.
          </p>
        </section>
        <p>
          Dúvidas:{" "}
          <Link href="/contato" className="underline underline-offset-4">
            fale conosco
          </Link>
          .
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
