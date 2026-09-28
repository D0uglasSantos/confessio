import { Badge } from "@/components/ui/badge";
import { sessionStatusLabel } from "@/lib/admin/labels";
import { isSessionLive } from "@/components/admin/parish/session-helpers";
import type { ParishSessionStatus } from "@/components/admin/parish/session-helpers";

export function SessionStatusBadge({
  status,
}: {
  status: ParishSessionStatus;
}) {
  const label = sessionStatusLabel[status] ?? status;

  if (isSessionLive(status)) {
    return (
      <Badge className="gap-1.5">
        <span className="size-1.5 rounded-full bg-current" />
        {label}
      </Badge>
    );
  }

  if (status === "CANCELLED") {
    return <Badge variant="destructive">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}
