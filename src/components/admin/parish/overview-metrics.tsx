import { formatCount, formatCounted } from "@/lib/admin/format";
import { StatsRow } from "@/components/ui/stats-row";
import {
  getParishSessionStats,
  type ParishSessionSummary,
} from "@/components/admin/parish/session-helpers";

export function ParishOverviewMetrics({
  sessions,
}: {
  sessions: ParishSessionSummary[];
}) {
  const stats = getParishSessionStats(sessions);

  return (
    <StatsRow
      items={[
        {
          label: "Em operação",
          value: formatCount(stats.live.length),
          hint: formatCounted(stats.live.length, {
            one: "fila em andamento",
            other: "filas em andamento",
          }),
          emphasize: stats.live.length > 0,
        },
        {
          label: "Rascunhos",
          value: formatCount(stats.drafts.length),
          hint: "Prontas para abrir",
        },
        {
          label: "Encerradas",
          value: formatCount(stats.finished.length),
          hint: "Histórico preservado",
        },
        {
          label: "Total",
          value: formatCount(stats.total),
          hint: "Sessões desta paróquia",
        },
      ]}
    />
  );
}
