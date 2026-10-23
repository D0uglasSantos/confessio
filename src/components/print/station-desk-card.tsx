import { BrandMark } from "@/components/brand-mark";

export function StationDeskCard({
  churchName,
  stationName,
  priestName,
  qrDataUrl,
  size = "sheet",
}: {
  churchName: string;
  stationName: string;
  priestName?: string | null;
  qrDataUrl: string;
  size?: "sheet" | "half";
}) {
  return (
    <article
      className={size === "half" ? "print-station-half" : "print-station-sheet"}
    >
      <BrandMark compact className="print-brand-mark" />
      <p className="print-kicker">{churchName}</p>
      <p className="print-station-label">Painel do sacerdote</p>
      {priestName ? (
        <h1 className="font-heading print-station-priest">{priestName}</h1>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`QR Code do ${stationName}`}
        className="print-station-qr"
      />
      <p className="print-station-hint">Aponte a câmera para abrir</p>
    </article>
  );
}
