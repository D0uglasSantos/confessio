import Link from "next/link";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";

const SESSION_PRIORITY = ["OPEN", "ENTRY_CLOSED", "DRAFT", "FINISHED"] as const;

type DemoLinks = {
  faithfulHref: string | null;
  priestHref: string | null;
  tvHref: string | null;
  hasSession: boolean;
};

function stationToken(
  access:
    | { access_token: string }
    | { access_token: string }[]
    | null
    | undefined,
) {
  if (!access) return null;
  return Array.isArray(access) ? access[0]?.access_token : access.access_token;
}

async function getDemoLinks(): Promise<DemoLinks> {
  const fallback: DemoLinks = {
    faithfulHref: null,
    priestHref: null,
    tvHref: null,
    hasSession: false,
  };

  try {
    const supabase = createAdminClient();
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, slug, status, created_at")
      .neq("status", "CANCELLED")
      .order("created_at", { ascending: false });

    const session = SESSION_PRIORITY.reduce(
      (found, status) =>
        found ?? sessions?.find((item) => item.status === status) ?? null,
      null as (NonNullable<typeof sessions>[number] | null),
    );

    if (!session) {
      return fallback;
    }

    const { data: stations } = await supabase
      .from("stations")
      .select("id, status, station_access(access_token)")
      .eq("session_id", session.id)
      .order("name");

    const station =
      stations?.find((item) => item.status === "AVAILABLE") ?? stations?.[0];
    const token = stationToken(station?.station_access);

    return {
      faithfulHref: `/s/${session.slug}`,
      tvHref: `/tv/${session.slug}`,
      priestHref: station
        ? token
          ? `/padre/${station.id}?token=${token}`
          : `/padre/${station.id}`
        : null,
      hasSession: true,
    };
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const links = await getDemoLinks();

  const surfaces = [
    {
      href: links.faithfulHref,
      title: "Fiel",
      description: "Entrar na fila pelo QR Code da sessão.",
      cta: "Entrar na fila",
    },
    {
      href: links.priestHref,
      title: "Sacerdote",
      description: "Chamar, atender e pausar o confessionário.",
      cta: "Abrir painel",
    },
    {
      href: links.tvHref,
      title: "TV / Telão",
      description: "Mostrar a senha chamada e os confessionários.",
      cta: "Abrir telão",
    },
    {
      href: "/admin",
      title: "Administração",
      description: "Abrir sessão, acompanhar a fila e métricas.",
      cta: "Abrir admin",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <Badge variant="secondary" className="w-fit">
        Desenvolvimento
      </Badge>
      <h1 className="font-heading mt-4 text-4xl leading-tight text-balance">
        Fila de Confissões
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted-foreground">
        Sistema de senhas anônimas para paróquias. Entre no admin, crie uma
        sessão e só então abra fiel, padre e TV.
      </p>
      {!links.hasSession ? (
        <p className="mt-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Ainda não há sessão no banco. Fiel, sacerdote e telão ficam
          indisponíveis até você criar e abrir uma sessão no admin.
        </p>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {surfaces.map((surface) => (
          <Card key={surface.title}>
            <CardHeader>
              <CardTitle>{surface.title}</CardTitle>
              <CardDescription>{surface.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {surface.href ? (
                <Link
                  href={surface.href}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {surface.cta}
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "pointer-events-none opacity-50",
                  )}
                >
                  Sem sessão
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
