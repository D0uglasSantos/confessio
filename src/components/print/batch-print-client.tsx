"use client";

import { useEffect, useMemo, useState } from "react";

import { PrintToolbar } from "@/components/print/print-toolbar";
import { toQrDataUrl } from "@/lib/qr";

export type BatchPrintSlip = {
  publicCode: string;
  claimUrl: string;
};

function chunk<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

export function BatchPrintClient({
  backHref,
  churchName,
  sessionName,
  tickets,
}: {
  backHref: string;
  churchName: string;
  sessionName: string;
  tickets: BatchPrintSlip[];
}) {
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const readyCount = Object.keys(qrs).length;
  const ready = readyCount === tickets.length && tickets.length > 0;
  const pages = useMemo(() => chunk(tickets, 4), [tickets]);

  useEffect(() => {
    let active = true;

    void Promise.all(
      tickets.map(async (ticket) => {
        const dataUrl = await toQrDataUrl(ticket.claimUrl, 220);
        return [ticket.publicCode, dataUrl] as const;
      }),
    ).then((entries) => {
      if (active) {
        setQrs(Object.fromEntries(entries));
      }
    });

    return () => {
      active = false;
    };
  }, [tickets]);

  useEffect(() => {
    if (!ready) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <main className="print-page print-batch">
      <style>{`@page { size: A4 portrait; margin: 0; }`}</style>
      <PrintToolbar backHref={backHref} />

      {!ready ? (
        <p className="print-batch-progress">
          Preparando QR codes... {readyCount}/{tickets.length}
        </p>
      ) : null}

      {pages.map((page, pageIndex) => (
        <section key={pageIndex} className="print-batch-page">
          {page.map((ticket) => (
            <article key={ticket.publicCode} className="print-batch-slip">
              <p className="print-kicker">{churchName}</p>
              <p className="print-batch-session">{sessionName}</p>
              <p className="print-ticket-label">Sua senha</p>
              <p className="font-heading print-batch-code">
                {ticket.publicCode}
              </p>
              {qrs[ticket.publicCode] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrs[ticket.publicCode]}
                  alt={`QR Code da senha ${ticket.publicCode}`}
                  className="print-batch-qr"
                />
              ) : (
                <div className="print-batch-qr print-batch-qr-pending" />
              )}
              <p className="print-batch-hint">Acompanhe no telão</p>
              <p className="print-batch-note">
                Com celular, aponte a câmera neste QR. Sem celular, use este
                papel.
              </p>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}