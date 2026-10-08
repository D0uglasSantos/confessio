import Link from "next/link";
import {
  ArrowRight,
  Building2,
  LayoutDashboard,
  LockKeyhole,
  QrCode,
  Radio,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const trustPoints = [
  {
    icon: LockKeyhole,
    title: "Privacidade por princípio",
    description:
      "O fiel entra sem conta. Nome e e-mail não são pedidos; telefone só se quiser aviso no WhatsApp.",
  },
  {
    icon: Radio,
    title: "Tudo em tempo real",
    description:
      "Senha, telão e painel do sacerdote acompanham a mesma fila, sem desencontro.",
  },
  {
    icon: Building2,
    title: "Feito para paróquias",
    description:
      "Cada comunidade cuida das próprias sessões; a plataforma mantém a operação organizada.",
  },
] as const;

const arrivalPoints = [
  {
    number: "01",
    icon: QrCode,
    audience: "Fiel",
    title: "Aponte a câmera",
    description:
      "O QR da sessão abre a fila no celular. Sem conta e sem cadastro pessoal.",
  },
  {
    number: "02",
    icon: Sparkles,
    audience: "Sacerdote",
    title: "Chame a próxima senha",
    description:
      "Cada confessionário recebe um acesso próprio para conduzir o atendimento.",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    audience: "Comunidade",
    title: "Acompanhe no telão",
    description:
      "As chamadas aparecem em tempo real, com clareza para quem está aguardando.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <BrandMark />
          <Link
            href="/admin/login"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Administração
          </Link>
        </header>

        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:py-24">
          <div>
            <Badge variant="secondary" className="h-7 px-3 text-xs">
              Tecnologia a serviço do acolhimento
            </Badge>
            <h1 className="font-heading mt-6 max-w-[13ch] text-5xl leading-[0.98] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.5rem]">
              Menos espera. Mais serenidade.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8 sm:text-xl">
              Acolhimento e organização para paróquias: uma fila anônima e em
              tempo real — do primeiro QR Code à chamada no telão.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/contato"
                className={buttonVariants({ size: "lg" })}
              >
                Quero levar para minha paróquia
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/admin/login"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Entrar na administração
              </Link>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Fiel e sacerdote não criam conta.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] bg-card p-5 ring-1 ring-foreground/8 sm:p-8">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="brand-kicker">Sessão em andamento</p>
                  <p className="font-heading mt-2 text-2xl font-semibold">
                    Confissões da tarde
                  </p>
                </div>
                <span className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold">
                  <span className="bg-brand-sage size-2 rounded-full" />
                  Ao vivo
                </span>
              </div>

              <div className="bg-primary text-primary-foreground mt-8 rounded-2xl px-6 py-8 text-center">
                <p className="text-primary-foreground/70 text-sm">
                  Dirija-se ao Confessionário 2
                </p>
                <p className="font-heading mt-3 text-7xl leading-none font-semibold tracking-[-0.04em] sm:text-8xl">
                  A-042
                </p>
                <p className="text-brand-gold-light mt-4 text-sm font-medium">
                  Sua vez chegou
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-1">
                  <p className="font-heading text-3xl font-semibold tabular-nums">
                    12
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs font-medium tracking-[0.08em] uppercase">
                    aguardando
                  </p>
                </div>
                <div className="p-1">
                  <p className="font-heading text-3xl font-semibold tabular-nums">
                    3
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs font-medium tracking-[0.08em] uppercase">
                    confessionários
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-border/80 grid gap-4 border-y py-8 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 pr-4">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="brand-kicker">Um caminho simples</p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Cada pessoa vê apenas o que precisa
            </h2>
            <p className="text-muted-foreground mt-3">
              A secretaria prepara a sessão; os outros acessos chegam pelos QR
              Codes e links daquele encontro.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {arrivalPoints.map(
              ({ number, icon: Icon, audience, title, description }) => (
                <article key={title} className="min-w-0">
                  <p className="font-heading text-primary/40 text-4xl leading-none">
                    {number}
                  </p>
                  <p className="brand-kicker mt-6 inline-flex items-center gap-2">
                    <Icon className="size-4" />
                    {audience}
                  </p>
                  <h3 className="font-heading mt-2 text-2xl font-semibold">
                    {title}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {description}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <SiteFooter extra="A plataforma administra somente o fluxo. Nunca armazena o conteúdo da confissão." />
      </div>
    </main>
  );
}
