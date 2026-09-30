import { Suspense } from "react";

import { ChurchDirectory } from "@/components/admin/global/church-directory";
import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { CreateChurchDialog } from "@/components/admin/global/create-church-dialog";
import { PanelLoading } from "@/components/loading-state";
import { parseGlobalChurches } from "@/lib/admin/global-metrics";
import { requireGlobalAdmin } from "@/lib/admin/global";

export const metadata = {
  title: "Paróquias",
};

export default async function AdminGlobalChurchesPage() {
  const { supabase } = await requireGlobalAdmin("viewer");
  const { data: churchesRaw } = await supabase.rpc("global_list_churches");
  const churches = parseGlobalChurches(churchesRaw);

  return (
    <>
      <ConsolePageHeader
        title="Paróquias"
        description="Cadastro, status e administradores locais. Cada paróquia opera com dados isolados."
        actions={<CreateChurchDialog />}
      />
      <Suspense fallback={<ChurchDirectoryFallback />}>
        <ChurchDirectory churches={churches} />
      </Suspense>
    </>
  );
}

function ChurchDirectoryFallback() {
  return <PanelLoading label="Carregando paróquias..." />;
}
