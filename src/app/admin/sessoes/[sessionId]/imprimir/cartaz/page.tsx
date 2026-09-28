import { notFound } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { PrintAuto, PrintToolbar } from "@/components/print/print-toolbar";
import { requireAdminChurch } from "@/lib/admin/church";
import { sessionPublicUrl } from "@/lib/app-url";
import { toQrDataUrl } from "@/lib/qr";

type CartazPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPosterPage({ params }: CartazPageProps) {
  const { sessionId } = await params;
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, name, slug, church_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.church_id !== church.id) {
    notFound();
  }

  const publicUrl = sessionPublicUrl(session.slug);
  const qrDataUrl = await toQrDataUrl(publicUrl, 560);
  const backHref = `/admin/sessoes/${session.id}`;

  return (
    <main className="print-page print-poster">
      <style>{`@page { size: A4 portrait; margin: 12mm; }`}</style>
      <PrintAuto />
      <PrintToolbar backHref={backHref} />

      <article className="print-poster-sheet">
        <BrandMark compact className="print-brand-mark" />
        <p className="print-kicker">{church.name}</p>
        <h1 className="font-heading print-poster-title">{session.name}</h1>
        <p className="print-poster-lead">
          Aponte a câmera do celular para entrar na fila
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`QR Code da sessão ${session.slug}`}
          className="print-poster-qr"
        />

        <p className="print-poster-hint">
          Não precisa criar conta. Sua senha aparece no celular e no telão.
        </p>
        <p className="print-poster-url">{publicUrl}</p>
      </article>
    </main>
  );
}
