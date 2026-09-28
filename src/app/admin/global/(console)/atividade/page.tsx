import { AuditLogList } from "@/components/admin/global/audit-log-list";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { requireGlobalAdmin } from "@/lib/admin/global";

export const metadata = {
  title: "Atividade",
};

export default async function AdminGlobalActivityPage() {
  const { supabase } = await requireGlobalAdmin("viewer");
  const { data: auditLog } = await supabase
    .from("platform_audit_log")
    .select("id, action, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <ConsolePageHeader
        title="Atividade"
        description="Registro das ações administrativas da plataforma. Sem dados de fiéis."
      />
      <AuditLogList entries={auditLog ?? []} />
    </>
  );
}
