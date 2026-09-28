import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import { SessionDirectory } from "@/components/admin/parish/session-directory";
import type { ParishSessionSummary } from "@/components/admin/parish/session-helpers";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminChurch } from "@/lib/admin/church";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sessões",
};

export default async function AdminSessionsPage() {
  const { church, admin, supabase, user } = await requireAdminChurch();
  const [{ data: sessions }, { data: isGlobalAdmin }] = await Promise.all([
    admin
      .from("sessions")
      .select("id, name, slug, status, starts_at, created_at")
      .eq("church_id", church.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("is_global_admin", { p_required_role: "viewer" }),
  ]);

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
    >
      <ConsolePageHeader
        title="Sessões"
        description="Rascunhos, filas em operação e histórico da paróquia."
        actions={
          <Link href="/admin/sessoes/nova" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" />
            Nova sessão
          </Link>
        }
      />
      <Suspense fallback={<SessionsFallback />}>
        <SessionDirectory
          sessions={(sessions ?? []) as ParishSessionSummary[]}
        />
      </Suspense>
    </ParishShell>
  );
}

function SessionsFallback() {
  return (
    <Card>
      <CardContent className="text-muted-foreground py-8 text-sm">
        Carregando sessões...
      </CardContent>
    </Card>
  );
}
