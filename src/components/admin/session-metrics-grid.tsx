import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMinutes, type SessionMetrics } from "@/lib/admin/metrics";

export function SessionMetricsGrid({ metrics }: { metrics: SessionMetrics }) {
  const cards = [
    ["Na fila", metrics.waiting],
    ["Chamados", metrics.called],
    ["Em atendimento", metrics.in_service],
    ["Concluídos", metrics.completed],
    ["Total de senhas", metrics.total],
    ["Confessionários ativos", metrics.active_stations],
    ["Tempo médio de espera", formatMinutes(metrics.average_wait_minutes)],
    [
      "Tempo médio de atendimento",
      formatMinutes(metrics.average_service_minutes),
    ],
  ] as const;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Métricas</h2>
        <p className="text-sm text-muted-foreground">
          Números operacionais agregados desta sessão. Sem dados pessoais.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Não compareceram: {metrics.no_show} · Cancelados: {metrics.cancelled}
      </p>
    </section>
  );
}
