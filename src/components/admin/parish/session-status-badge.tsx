import { BanIcon, CheckCircle2Icon, FilePenIcon, RadioIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { sessionStatusLabel } from "@/lib/admin/labels";
import { isSessionLive } from "@/components/admin/parish/session-helpers";
import type { ParishSessionStatus } from "@/components/admin/parish/session-helpers";
import { cn } from "cn";

export function SessionStatusBadge({
  status,
}: {
  status: ParishSessionStatus;
}) {
  const label = sessionStatusLabel[status] ?? status;

  if (isSessionLive(status)) {
    return (
      <Badge variant="success" className="gap-1.5">
        <span className="relative flex size-1.5">
          <span className="bg-brand-sage/70 absolute inline-flex size-full animate-ping rounded-full motion-reduce:animate-none" />
          <span className="bg-brand-sage relative inline-flex size-1.5 rounded-full" />
        </span>
        <RadioIcon className="size-3" aria-hidden="true" />
        {label}
      </Badge>
    );
  }

  if (status === "CANCELLED") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <BanIcon className="size-3" aria-hidden="true" />
        {label}
      </Badge>
    );
  }

  if (status === "DRAFT") {
    return (
      <Badge
        variant="outline"
        className={cn("text-muted-foreground gap-1.5")}
      >
        <FilePenIcon className="size-3" aria-hidden="true" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <CheckCircle2Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
