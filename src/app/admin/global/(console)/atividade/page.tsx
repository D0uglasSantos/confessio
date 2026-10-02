import { AuditLogList } from "@/components/admin/global/audit-log-list";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { parseAuditLog } from "@/lib/admin/global-metrics";
import { requireGlobalAdmin } from "@/lib/admin/global";

export const metadata = {
  title: "Atividade",
};

export default async function AdminGlobalActivityPage() {
  const { supabase } = await requireGlobalAdmin("viewer");
  const { data: auditRaw, error } = await supabase.rpc("global_list_audit_log", {
    p_limit: 50,
  });

  return (
    <>
      <ConsolePageHeader
        title="Atividade"
        description="Registro das ações administrativas da plataforma. Sem dados de fiéis."
      />
      <AuditLogList entries={parseAuditLog(auditRaw)} loadError={Boolean(error)} />
    </>
  );
}
