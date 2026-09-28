import Link from "next/link";

import { AuditLogList } from "@/components/admin/global/audit-log-list";
import { ChurchList } from "@/components/admin/global/church-list";
import { CreateChurchForm } from "@/components/admin/global/create-church-form";
import { GlobalMetricsGrid } from "@/components/admin/global/global-metrics-grid";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  parseGlobalChurches,
  parseGlobalDashboardMetrics,
} from "@/lib/admin/global-metrics";
import { requireGlobalAdmin } from "@/lib/admin/global";

export const dynamic = "force-dynamic";

export default async function AdminGlobalPage() {
  const { supabase, user } = await requireGlobalAdmin("viewer");

  const [
    { data: churchesRaw },
    { data: metricsRaw },
    { data: auditLog },
    { data: parishMembership },
  ] = await Promise.all([
    supabase.rpc("global_list_churches"),
    supabase.rpc("global_get_dashboard_metrics", {}),
    supabase
      .from("platform_audit_log")
      .select("id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("church_admins")
      .select("church_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const churches = parseGlobalChurches(churchesRaw);
  const metrics = parseGlobalDashboardMetrics(metricsRaw);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">Plataforma</Badge>
          <h1 className="font-heading mt-3 text-4xl">Administração global</h1>
          <p className="mt-2 text-muted-foreground">
            Cadastre paróquias, vincule administradores locais e acompanhe a
            saúde operacional de todo o sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {parishMembership ? (
            <Link
              href="/admin"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Painel da paróquia
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      {metrics ? <GlobalMetricsGrid metrics={metrics} /> : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Paróquias</h2>
          <p className="text-sm text-muted-foreground">
            Toda paróquia é isolada por dados. Um admin local só enxerga sua
            própria paróquia.
          </p>
        </div>
        <ChurchList churches={churches} />
      </section>

      <AuditLogList entries={auditLog ?? []} />

      <Separator />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Nova paróquia</h2>
          <p className="text-sm text-muted-foreground">
            Depois de cadastrar, vincule o admin local pelo ID de usuário
            criado no Supabase Auth.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastro</CardTitle>
            <CardDescription>
              O slug identifica a paróquia nas rotas públicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateChurchForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
