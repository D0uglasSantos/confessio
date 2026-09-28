import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMinutes } from "@/lib/admin/metrics";
import type { GlobalDashboardMetrics } from "@/lib/admin/global-metrics";

export function GlobalMetricsGrid({
  metrics,
}: {
  metrics: GlobalDashboardMetrics;
}) {
  const cards = [
    ["Paróquias cadastradas", metrics.churches_total],
    ["Com sessão ativa agora", metrics.churches_with_active_session],
    ["Sessões abertas (30d)", metrics.sessions_opened_in_period],
    ["Senhas emitidas (30d)", metrics.tickets_created_in_period],
    ["Taxa de no-show (30d)", `${metrics.no_show_rate_percent}%`],
    [
      "Tempo médio de atendimento",
      formatMinutes(metrics.average_service_minutes),
    ],
  ] as const;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Métricas da plataforma</h2>
        <p className="text-sm text-muted-foreground">
          Números operacionais agregados de todas as paróquias. Sem dados
          pessoais ou conteúdo de confissão.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
