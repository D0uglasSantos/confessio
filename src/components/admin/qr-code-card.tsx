"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { toQrDataUrl } from "@/lib/qr";
import { Button, buttonVariants } from "@/components/ui/button";

export function QrCodeCard({
  url,
  slug,
  posterHref,
}: {
  url: string;
  slug: string;
  posterHref: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    toQrDataUrl(url, 320).then((value) => {
      if (active) setDataUrl(value);
    });

    return () => {
      active = false;
    };
  }, [url]);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`QR Code da sessão ${slug}`}
          className="size-40 rounded-xl border border-border bg-card"
        />
      ) : (
        <div className="size-40 animate-pulse rounded-xl bg-muted" />
      )}

      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Link público do fiel</p>
          <p className="break-all font-medium">{url}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copyLink}>
            Copiar link
          </Button>
          {dataUrl ? (
            <a href={dataUrl} download={`qr-${slug}.png`}>
              <Button type="button" variant="secondary">
                Baixar PNG
              </Button>
            </a>
          ) : null}
          <Link
            href={posterHref}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            Imprimir cartaz
          </Link>
        </div>
      </div>
    </div>
  );
}
