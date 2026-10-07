import { formatCount, formatCounted } from "@/lib/admin/format";
import { formatDuration, type SessionMetrics } from "@/lib/admin/metrics";
import { StatsRow } from "@/components/ui/stats-row";

export function SessionMetricsGrid({
  metrics,
  compact = false,
}: {
  metrics: SessionMetrics;
  compact?: boolean;
}) {
  const primary = [
    {
      label: "Na fila",
      value: formatCount(metrics.waiting),
      hint: "Aguardando chamada",
      emphasize: true,
    },
    {
      label: "Em atendimento",
      value: formatCount(metrics.in_service),
      hint: formatCounted(metrics.active_stations, {
        one: "confessionário ativo",
        other: "confessionários ativos",
      }),
      emphasize: true,
    },
    {
      label: "Concluídos",
      value: formatCount(metrics.completed),
      hint: `${formatCounted(metrics.no_show, { one: "ausência", other: "ausências" })} · ${formatCounted(metrics.cancelled, { one: "cancelada", other: "canceladas" })}`,
      emphasize: true,
    },
  ];

  const secondary = [
    {
      label: "Chamados",
      value: formatCount(metrics.called),
      hint: "No confessionário",
    },
    {
      label: "Total",
      value: formatCount(metrics.total),
      hint: "Senhas emitidas",
    },
    {
      label: "Espera média",
      value: formatDuration(metrics.average_wait_minutes),
      hint: "Até a primeira chamada",
    },
    {
      label: "Atendimento médio",
      value: formatDuration(metrics.average_service_minutes),
      hint: "No confessionário",
    },
    {
      label: "Não compareceram",
      value: formatCount(metrics.no_show),
      hint: "Chamadas sem presença",
    },
  ];

  return (
    <div className="space-y-4">
      <StatsRow items={primary} />
      {compact ? null : (
        <StatsRow items={secondary} className="text-sm opacity-90" />
      )}
    </div>
  );
}
