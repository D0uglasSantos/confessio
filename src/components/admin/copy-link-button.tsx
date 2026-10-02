"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

export function CopyLinkButton({
  url,
  label = "Copiar link",
  variant = "outline",
  size = "sm",
  className,
}: {
  url: string;
  label?: string;
  variant?: "outline" | "secondary" | "default" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={copy}
    >
      {label}
    </Button>
  );
}
