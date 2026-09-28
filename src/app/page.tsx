import Link from "next/link";
import { LayoutDashboard, QrCode, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Fiel sempre anônimo",
    description:
      "Nenhum nome, telefone ou dado pessoal é solicitado para entrar na fila.",
  },
  {
    icon: Sparkles,
    title: "Fila em tempo real",
    description:
      "Senha, telão e painel do sacerdote sincronizados a cada chamada.",
  },
  {
    icon: LayoutDashboard,
    title: "Várias paróquias, dados isolados",
    description:
      "Cada secretaria opera só a sua paróquia. A plataforma governa o cadastro.",
  },
] as const;

const arrivalPoints = [
  {
    icon: QrCode,
    audience: "Fiel",
    title: "Entra pelo QR da sessão",
    description:
      "Sem login. A secretaria imprime o cartaz; o fiel aponta a câmera e recebe a senha.",
  },
  {
    icon: QrCode,
    audience: "Sacerdote",
    title: "Entra pelo QR da mesa",
    description:
      "Sem conta. Cada confessionário tem um cartão com o link operacional daquele posto.",
  },
  {
    icon: LayoutDashboard,
    audience: "Telão",
    title: "Abre a partir da secretaria",
    description:
      "A TV da sessão é um link público daquela fila, aberto no computador da igreja.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-14 sm:py-20">
        <header className="flex items-center justify-between gap-4">
          <span className="font-heading text-lg font-medium">
            Fila de Confissões
          </span>
          <Link
            href="/admin/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Entrar na administração
          </Link>
        </header>

        <section className="mt-12 max-w-2xl sm:mt-16">
          <Badge variant="secondary" className="w-fit">
            Para paróquias
          </Badge>
          <h1 className="font-heading mt-4 text-4xl leading-tight text-balance sm:text-5xl">
            Fila de confissões organizada, anônima e em tempo real
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            A secretaria abre a sessão. Os fiéis entram pelo QR Code. Cada
            confessionário chama a próxima senha — sem fila física e sem
            identificar quem está confessando.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/login" className={buttonVariants({ size: "lg" })}>
              Entrar na administração
            </Link>
          </div>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Login só para secretaria da paróquia e para a administração da
            plataforma. Fiel e sacerdote não criam conta.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14 space-y-4">
          <div>
            <h2 className="font-heading text-2xl">Como cada pessoa chega</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A home não escolhe a sessão. Cada paróquia opera a sua própria
              fila, pelos links gerados no painel.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {arrivalPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {point.audience}
                </p>
                <p className="mt-2 font-medium">{point.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
          Nenhum dado da confissão é armazenado. O fiel nunca precisa criar
          conta ou se identificar.
        </footer>
      </div>
    </main>
  );
}
