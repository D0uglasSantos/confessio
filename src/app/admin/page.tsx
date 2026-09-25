import Link from "next/link";

import { CreateSessionForm } from "@/components/admin/create-session-form";
import { formatAdminDateTime } from "@/lib/admin/format";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdminChurch } from "@/lib/admin/church";
import { sessionStatusLabel } from "@/lib/admin/labels";

export default async function AdminPage() {
  const { supabase, church } = await requireAdminChurch();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, slug, status, starts_at, created_at")
    .eq("church_id", church.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">{church.name}</Badge>
          <h1 className="font-heading mt-3 text-4xl">Administração</h1>
          <p className="mt-2 text-muted-foreground">
            Crie sessões, abra a fila e compartilhe o QR Code com os fiéis.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Sessões</h2>
        <div className="grid gap-4">
          {(sessions ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                Nenhuma sessão criada ainda.
              </CardContent>
            </Card>
          ) : (
            (sessions ?? []).map((session) => (
              <Card key={session.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{session.name}</CardTitle>
                    <CardDescription>
                      /s/{session.slug}
                      {session.starts_at
                        ? ` · ${formatAdminDateTime(session.starts_at)}`
                        : null}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {sessionStatusLabel[session.status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/admin/sessoes/${session.id}`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Abrir sessão
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Nova sessão</h2>
          <p className="text-sm text-muted-foreground">
            A sessão nasce como rascunho. Depois você abre a fila quando a
            equipe estiver pronta.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <CreateSessionForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
