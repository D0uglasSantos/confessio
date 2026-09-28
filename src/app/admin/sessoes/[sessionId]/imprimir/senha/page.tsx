import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { PrintAuto, PrintToolbar } from "@/components/print/print-toolbar";
import { requireAdminChurch } from "@/lib/admin/church";

type PaperTicketPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ codigo?: string }>;
};

export default async function PaperTicketPage({
  params,
  searchParams,
}: PaperTicketPageProps) {
  const { sessionId } = await params;
  const { codigo } = await searchParams;
  const publicCode = codigo?.trim().toUpperCase();

  if (!publicCode) {
    notFound();
  }

  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, name, slug, church_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.church_id !== church.id) {
    notFound();
  }

  const { data: ticket } = await admin
    .from("tickets")
    .select("id, public_code")
    .eq("session_id", session.id)
    .eq("public_code", publicCode)
    .maybeSingle();

  if (!ticket) {
    notFound();
  }

  const backHref = `/admin/sessoes/${session.id}`;

  return (
    <main className="print-page print-ticket">
      <style>{`@page { size: A6 portrait; margin: 6mm; }`}</style>
      <PrintAuto />
      <PrintToolbar backHref={backHref} />

      <article className="print-ticket-sheet">
        <BrandMark compact className="print-brand-mark" />
        <p className="print-kicker">{church.name}</p>
        <p className="print-ticket-session">{session.name}</p>
        <p className="print-ticket-label">Sua senha</p>
        <p className="font-heading print-ticket-code">{ticket.public_code}</p>
        <p className="print-ticket-hint">Acompanhe no telão</p>
        <p className="print-ticket-note">
          Não é necessário celular. Quando este número for chamado, dirija-se ao
          confessionário indicado.
        </p>
      </article>
    </main>
  );
}
