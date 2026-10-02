import Link from "next/link";

import { AuditLogList } from "@/components/admin/global/audit-log-list";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { GlobalMetricsGrid } from "@/components/admin/global/global-metrics-grid";
import { PlatformAttention } from "@/components/admin/global/platform-attention";
import { buttonVariants } from "@/components/ui/button";
import {
  parseAuditLog,
  parseGlobalChurches,
  parseGlobalDashboardMetrics,
} from "@/lib/admin/global-metrics";
import { requireGlobalAdmin } from "@/lib/admin/global";

export const metadata = {
  title: "Visão geral",
};

export default async function AdminGlobalOverviewPage() {
  const { supabase } = await requireGlobalAdmin("viewer");

  const [
    { data: churchesRaw },
    { data: metricsRaw },
    { data: auditRaw, error: auditError },
  ] = await Promise.all([
    supabase.rpc("global_list_churches"),
    supabase.rpc("global_get_dashboard_metrics", {}),
    supabase.rpc("global_list_audit_log", { p_limit: 8 }),
  ]);

  const churches = parseGlobalChurches(churchesRaw);
  const metrics = parseGlobalDashboardMetrics(metricsRaw);

  return (
    <>
      <ConsolePageHeader
        title="Visão geral"
        description="Saúde operacional de todas as paróquias. Sem dados pessoais ou conteúdo de confissão."
        actions={
          <Link
            href="/admin/global/paroquias"
            className={buttonVariants()}
          >
            Gerenciar paróquias
          </Link>
        }
      />

      {metrics ? (
        <GlobalMetricsGrid metrics={metrics} churches={churches} />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PlatformAttention churches={churches} />
        </div>
        <div className="lg:col-span-2">
          <AuditLogList
            entries={parseAuditLog(auditRaw)}
            loadError={Boolean(auditError)}
            showViewAll
          />
        </div>
      </section>
    </>
  );
}
