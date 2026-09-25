import { notFound } from "next/navigation";

import { BatchPrintClient } from "@/components/print/batch-print-client";
import { parsePrintBatch } from "@/lib/admin/print-batch";
import { requireAdminChurch } from "@/lib/admin/church";
import { ticketClaimUrl } from "@/lib/app-url";

type BatchPrintPageProps = {
  params: Promise<{ sessionId: string; batchId: string }>;
};

export default async function BatchPrintPage({ params }: BatchPrintPageProps) {
  const { sessionId, batchId } = await params;
  const { supabase, church } = await requireAdminChurch();

  const { data, error } = await supabase.rpc("admin_get_print_batch", {
    p_batch_id: batchId,
  });

  if (error || !data) {
    notFound();
  }

  const batch = parsePrintBatch(data);

  if (
    !batch ||
    batch.sessionId !== sessionId ||
    batch.tickets.length === 0
  ) {
    notFound();
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, church_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.church_id !== church.id) {
    notFound();
  }

  return (
    <BatchPrintClient
      backHref={`/admin/sessoes/${sessionId}`}
      churchName={batch.churchName || church.name}
      sessionName={batch.sessionName}
      tickets={batch.tickets.map((ticket) => ({
        publicCode: ticket.publicCode,
        claimUrl: ticketClaimUrl(batch.sessionSlug, ticket.token),
      }))}
    />
  );
}