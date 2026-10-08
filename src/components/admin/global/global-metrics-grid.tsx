import { formatCount, formatCounted, formatPercent, pluralize } from "@/lib/admin/format";
import { formatDuration } from "@/lib/admin/metrics";
import type {
  GlobalChurchSummary,
  GlobalDashboardMetrics,
} from "@/lib/admin/global-metrics";
import { StatsRow } from "@/components/ui/stats-row";

export function GlobalMetricsGrid({
  metrics,
  churches,
}: {
  metrics: GlobalDashboardMetrics;
  churches: GlobalChurchSummary[];
}) {
  const activeChurches = churches.filter((church) => church.is_active).length;
  const inactiveChurches = churches.length - activeChurches;
  const noShow = metrics.no_show_rate_percent;

  return (
    <div className="space-y-4">
      <StatsRow
        items={[
          {
            label: "Paróquias",
            value: formatCount(metrics.churches_total),
            hint:
              inactiveChurches > 0
                ? `${formatCounted(activeChurches, { one: "ativa", other: "ativas" })} · ${formatCounted(inactiveChurches, { one: "desativada", other: "desativadas" })}`
                : formatCounted(activeChurches, {
                    one: "ativa",
                    other: "ativas",
                  }),
            emphasize: true,
          },
          {
            label: "Em operação",
            value: formatCount(metrics.churches_with_active_session),
            hint: `${formatCount(metrics.churches_with_active_session)} ${pluralize(metrics.churches_with_active_session, { one: "paróquia com fila aberta", other: "paróquias com fila aberta" })}`,
            emphasize: metrics.churches_with_active_session > 0,
          },
          {
            label: "Filas no período",
            value: formatCount(metrics.sessions_opened_in_period),
            hint: "Últimos 30 dias",
            emphasize: true,
          },
        ]}
      />
      <StatsRow
        items={[
          {
            label: "Senhas emitidas",
            value: formatCount(metrics.tickets_created_in_period),
            hint: "Últimos 30 dias",
          },
          {
            label: "Taxa de ausência",
            value: formatPercent(noShow),
            hint: "Últimos 30 dias",
          },
          {
            label: "Tempo médio",
            value: formatDuration(metrics.average_service_minutes),
            hint: "Atendimento, últimos 30 dias",
          },
        ]}
      />
    </div>
  );
}
