"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyIcon } from "lucide-react";
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
    <div className="space-y-4">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`QR Code da sessão ${slug}`}
          className="size-44 rounded-xl border border-border/80 bg-card p-2"
        />
      ) : (
        <div className="size-44 animate-pulse rounded-xl bg-muted" />
      )}

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 break-all text-sm">{url}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Copiar link"
            onClick={copyLink}
          >
            <CopyIcon />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {dataUrl ? (
            <a href={dataUrl} download={`qr-${slug}.png`}>
              <Button type="button" variant="outline" size="sm">
                Baixar PNG
              </Button>
            </a>
          ) : null}
          <Link
            href={posterHref}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Imprimir cartaz
          </Link>
        </div>
      </div>
    </div>
  );
}
