import {
  ChurchIcon,
  ClockIcon,
  RadioIcon,
  TicketIcon,
  TimerIcon,
  UserRoundXIcon,
} from "lucide-react";

import { formatCount } from "@/lib/admin/format";
import { formatMinutes } from "@/lib/admin/metrics";
import type {
  GlobalChurchSummary,
  GlobalDashboardMetrics,
} from "@/lib/admin/global-metrics";
import { Card, CardContent } from "@/components/ui/card";

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
  const noShowTone = noShow >= 20 ? "text-destructive" : "text-card-foreground";

  const cards = [
    {
      label: "Paróquias",
      value: formatCount(metrics.churches_total),
      hint:
        inactiveChurches > 0
          ? `${formatCount(activeChurches)} ativas · ${formatCount(inactiveChurches)} desativadas`
          : `${formatCount(activeChurches)} ativas`,
      icon: ChurchIcon,
      live: false,
    },
    {
      label: "Em operação agora",
      value: formatCount(metrics.churches_with_active_session),
      hint:
        metrics.churches_with_active_session === 1
          ? "1 paróquia com fila aberta"
          : `${formatCount(metrics.churches_with_active_session)} paróquias com fila aberta`,
      icon: RadioIcon,
      live: metrics.churches_with_active_session > 0,
    },
    {
      label: "Sessões abertas",
      value: formatCount(metrics.sessions_opened_in_period),
      hint: "Últimos 30 dias",
      icon: ClockIcon,
      live: false,
    },
    {
      label: "Senhas emitidas",
      value: formatCount(metrics.tickets_created_in_period),
      hint: "Últimos 30 dias",
      icon: TicketIcon,
      live: false,
    },
    {
      label: "Taxa de no-show",
      value: `${noShow}%`,
      hint: "Últimos 30 dias",
      icon: UserRoundXIcon,
      live: false,
      valueClassName: noShowTone,
    },
    {
      label: "Tempo médio",
      value: formatMinutes(metrics.average_service_minutes),
      hint: "Atendimento, últimos 30 dias",
      icon: TimerIcon,
      live: false,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} size="sm">
            <CardContent className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                  {card.label}
                  {card.live ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-emerald-700 normal-case">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      Ao vivo
                    </span>
                  ) : null}
                </p>
                <p
                  className={`font-heading mt-1 text-3xl leading-none tabular-nums ${card.valueClassName ?? ""}`}
                >
                  {card.value}
                </p>
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {card.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
