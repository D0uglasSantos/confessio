import { Suspense } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import { SessionDirectory } from "@/components/admin/parish/session-directory";
import type { ParishSessionSummary } from "@/components/admin/parish/session-helpers";
import { PanelLoading } from "@/components/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminChurch } from "@/lib/admin/church";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sessões",
};

function withTicketStats(
  sessions: ParishSessionSummary[],
  tickets: Array<{ session_id: string; status: string }>,
) {
  const issued = new Map<string, number>();
  const completed = new Map<string, number>();

  for (const ticket of tickets) {
    issued.set(ticket.session_id, (issued.get(ticket.session_id) ?? 0) + 1);
    if (ticket.status === "COMPLETED") {
      completed.set(
        ticket.session_id,
        (completed.get(ticket.session_id) ?? 0) + 1,
      );
    }
  }

  return sessions.map((session) => ({
    ...session,
    tickets_issued: issued.get(session.id) ?? 0,
    tickets_completed: completed.get(session.id) ?? 0,
  }));
}

export default async function AdminSessionsPage() {
  const { church, admin, supabase, user } = await requireAdminChurch();
  const [{ data: sessions }, { data: isGlobalAdmin }] = await Promise.all([
    admin
      .from("sessions")
      .select(
        "id, name, slug, status, starts_at, created_at, ends_at, entry_opened_at, finished_at",
      )
      .eq("church_id", church.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("is_global_admin", { p_required_role: "viewer" }),
  ]);

  const list = (sessions ?? []) as ParishSessionSummary[];
  const sessionIds = list.map((session) => session.id);
  const { data: tickets } =
    sessionIds.length > 0
      ? await admin
          .from("tickets")
          .select("session_id, status")
          .in("session_id", sessionIds)
      : { data: [] };

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <ConsolePageHeader
        title="Sessões"
        description="Rascunhos, filas em operação e histórico da paróquia."
        actions={
          church.is_active ? (
            <Link href="/admin/sessoes/nova" className={buttonVariants()}>
              <PlusIcon data-icon="inline-start" />
              Nova sessão
            </Link>
          ) : undefined
        }
      />
      <Suspense fallback={<SessionsFallback />}>
        <SessionDirectory
          sessions={withTicketStats(list, tickets ?? [])}
          canCreate={church.is_active}
        />
      </Suspense>
    </ParishShell>
  );
}

function SessionsFallback() {
  return <PanelLoading label="Carregando sessões..." />;
}
