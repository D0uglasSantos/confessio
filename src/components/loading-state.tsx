import { MobileShell } from "@/components/mobile-shell";
import { cn } from "@/lib/utils";

export function PulseBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-xl", className)}
      aria-hidden="true"
    />
  );
}

export function MobileLoading({ label }: { label: string }) {
  return (
    <MobileShell className="justify-center gap-4">
      <div className="w-full space-y-4" aria-busy="true">
        <p className="sr-only">{label}</p>
        <PulseBlock className="h-8 w-40" />
        <PulseBlock className="h-48 w-full rounded-2xl" />
        <PulseBlock className="h-14 w-full" />
      </div>
    </MobileShell>
  );
}

export function PanelLoading({ label }: { label: string }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <p className="sr-only">{label}</p>
      <PulseBlock className="h-8 w-48" />
      <PulseBlock className="h-4 w-72 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <PulseBlock className="h-28" />
        <PulseBlock className="h-28" />
      </div>
      <PulseBlock className="h-40" />
    </div>
  );
}
