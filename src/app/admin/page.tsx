import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { ParishOverviewMetrics } from "@/components/admin/parish/overview-metrics";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import {
  getParishSessionStats,
  type ParishSessionSummary,
} from "@/components/admin/parish/session-helpers";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminChurch } from "@/lib/admin/church";
import { formatAdminDateTime } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Secretaria",
};

export default async function AdminPage() {
  const { church, admin, supabase, user } = await requireAdminChurch();
  const [{ data: sessions }, { data: isGlobalAdmin }] = await Promise.all([
    admin
      .from("sessions")
      .select("id, name, slug, status, starts_at, created_at")
      .eq("church_id", church.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("is_global_admin", { p_required_role: "viewer" }),
  ]);

  const list = (sessions ?? []) as ParishSessionSummary[];
  const stats = getParishSessionStats(list);
  const recent = list.slice(0, 6);

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <ConsolePageHeader
        title="Visão geral"
        description="Abra a fila, acompanhe as sessões e compartilhe o QR Code com os fiéis."
        actions={
          church.is_active ? (
            <Link href="/admin/sessoes/nova" className={buttonVariants()}>
              <PlusIcon data-icon="inline-start" />
              Nova sessão
            </Link>
          ) : undefined
        }
      />

      <ParishOverviewMetrics sessions={list} />

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Em operação</CardTitle>
            <CardDescription>
              Sessões com fila aberta ou entrada já encerrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.live.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma fila em andamento. Abra um rascunho ou crie uma nova
                sessão.
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.live.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/admin/sessoes/${session.id}`}
                      className="hover:bg-muted/70 flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{session.name}</p>
                        <p className="text-muted-foreground text-xs">
                          /s/{session.slug}
                          {session.starts_at
                            ? ` · ${formatAdminDateTime(session.starts_at)}`
                            : null}
                        </p>
                      </div>
                      <SessionStatusBadge status={session.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sessões recentes</CardTitle>
            <CardDescription>
              As últimas criadas nesta paróquia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma sessão ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {recent.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/admin/sessoes/${session.id}`}
                      className="hover:bg-muted/70 flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    >
                      <span className="truncate text-sm font-medium">
                        {session.name}
                      </span>
                      <SessionStatusBadge status={session.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {list.length > 0 ? (
              <Link
                href="/admin/sessoes"
                className="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline-offset-4 hover:underline"
              >
                Ver todas as sessões
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </ParishShell>
  );
}
