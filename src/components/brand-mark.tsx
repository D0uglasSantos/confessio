import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg viewBox="0 0 96 96" aria-hidden="true" className="size-10 shrink-0">
        <path
          d="M20 78V43c0-18.8 11.7-31 28-31s28 12.2 28 31v35"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="48" cy="67" r="5" className="fill-brand-gold" />
        <circle cx="48" cy="52" r="5" className="fill-brand-gold" />
        <circle cx="48" cy="37" r="5" className="fill-brand-gold" />
      </svg>
      {compact ? null : (
        <span className="font-heading text-[1.05rem] leading-[1.05] font-semibold tracking-[-0.015em]">
          <span className="text-foreground block">Fila de</span>
          <span className="text-primary block">Confissões</span>
        </span>
      )}
      {compact ? <span className="sr-only">Fila de Confissões</span> : null}
    </span>
  );
}
