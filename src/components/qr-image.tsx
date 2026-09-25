"use client";

import { useEffect, useState } from "react";

import { toQrDataUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";

export function QrImage({
  url,
  alt,
  width = 240,
  className,
}: {
  url: string;
  alt: string;
  width?: number;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    toQrDataUrl(url, width).then((value) => {
      if (active) setDataUrl(value);
    });

    return () => {
      active = false;
    };
  }, [url, width]);

  if (!dataUrl) {
    return (
      <div
        className={cn("animate-pulse rounded-lg bg-muted", className)}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt={alt} className={className} />
  );
}
