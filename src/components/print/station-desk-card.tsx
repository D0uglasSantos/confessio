export function StationDeskCard({
  churchName,
  sessionName,
  stationName,
  priestName,
  qrDataUrl,
  size = "sheet",
}: {
  churchName: string;
  sessionName: string;
  stationName: string;
  priestName?: string | null;
  qrDataUrl: string;
  size?: "sheet" | "half";
}) {
  return (
    <article className={size === "half" ? "print-station-half" : "print-station-sheet"}>
      <p className="print-kicker">{churchName}</p>
      <p className="print-station-session">{sessionName}</p>
      <p className="print-station-label">Painel do sacerdote</p>
      <h1 className="font-heading print-station-name">{stationName}</h1>
      {priestName ? <p className="print-station-priest">{priestName}</p> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`QR Code do ${stationName}`}
        className="print-station-qr"
      />
      <p className="print-station-hint">Aponte a câmera para abrir</p>
      <p className="print-station-note">
        Sem login. Use só neste confessionário. Cole este cartão na mesa.
      </p>
    </article>
  );
}