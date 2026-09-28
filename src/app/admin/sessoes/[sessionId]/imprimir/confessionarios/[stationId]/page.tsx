import { notFound } from "next/navigation";

import { StationDeskCard } from "@/components/print/station-desk-card";
import { PrintAuto, PrintToolbar } from "@/components/print/print-toolbar";
import { stationAccessToken } from "@/lib/admin/station-access";
import { requireAdminChurch } from "@/lib/admin/church";
import { stationPriestUrl } from "@/lib/app-url";
import { toQrDataUrl } from "@/lib/qr";

type StationCardPageProps = {
  params: Promise<{ sessionId: string; stationId: string }>;
};

export default async function StationCardPage({
  params,
}: StationCardPageProps) {
  const { sessionId, stationId } = await params;
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, name, church_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.church_id !== church.id) {
    notFound();
  }

  const { data: station } = await admin
    .from("stations")
    .select("id, name, priest_name, session_id, station_access(access_token)")
    .eq("id", stationId)
    .eq("session_id", session.id)
    .maybeSingle();

  const token = stationAccessToken(station?.station_access);

  if (!station || !token) {
    notFound();
  }

  const qrDataUrl = await toQrDataUrl(stationPriestUrl(station.id, token), 520);

  return (
    <main className="print-page print-station-cards">
      <style>{`@page { size: A5 portrait; margin: 8mm; }`}</style>
      <PrintAuto />
      <PrintToolbar backHref={`/admin/sessoes/${session.id}`} />

      <StationDeskCard
        churchName={church.name}
        sessionName={session.name}
        stationName={station.name}
        priestName={station.priest_name}
        qrDataUrl={qrDataUrl}
      />
    </main>
  );
}
