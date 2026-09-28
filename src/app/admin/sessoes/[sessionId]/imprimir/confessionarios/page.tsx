import { notFound } from "next/navigation";

import { StationDeskCard } from "@/components/print/station-desk-card";
import { PrintAuto, PrintToolbar } from "@/components/print/print-toolbar";
import { stationAccessToken } from "@/lib/admin/station-access";
import { requireAdminChurch } from "@/lib/admin/church";
import { stationPriestUrl } from "@/lib/app-url";
import { toQrDataUrl } from "@/lib/qr";

type StationCardsPageProps = {
  params: Promise<{ sessionId: string }>;
};

function chunk<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

export default async function StationCardsPage({
  params,
}: StationCardsPageProps) {
  const { sessionId } = await params;
  const { admin, church } = await requireAdminChurch();

  const { data: session } = await admin
    .from("sessions")
    .select("id, name, church_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.church_id !== church.id) {
    notFound();
  }

  const { data: stations } = await admin
    .from("stations")
    .select("id, name, priest_name, station_access(access_token)")
    .eq("session_id", session.id)
    .order("name");

  const printable = (stations ?? []).flatMap((station) => {
    const token = stationAccessToken(station.station_access);
    if (!token) return [];
    return [
      {
        id: station.id,
        name: station.name,
        priestName: station.priest_name,
        url: stationPriestUrl(station.id, token),
      },
    ];
  });

  if (printable.length === 0) {
    notFound();
  }

  const cards = await Promise.all(
    printable.map(async (station) => ({
      ...station,
      qrDataUrl: await toQrDataUrl(station.url, 420),
    })),
  );

  return (
    <main className="print-page print-station-cards">
      <style>{`@page { size: A4 portrait; margin: 0; }`}</style>
      <PrintAuto />
      <PrintToolbar backHref={`/admin/sessoes/${session.id}`} />

      {chunk(cards, 2).map((page) => (
        <section
          key={page.map((card) => card.id).join("-")}
          className="print-station-page"
        >
          {page.map((card) => (
            <StationDeskCard
              key={card.id}
              size="half"
              churchName={church.name}
              sessionName={session.name}
              stationName={card.name}
              priestName={card.priestName}
              qrDataUrl={card.qrDataUrl}
            />
          ))}
        </section>
      ))}
    </main>
  );
}
