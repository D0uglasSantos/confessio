import {
  ClockIcon,
  HourglassIcon,
  TicketIcon,
  TimerIcon,
  UserCheckIcon,
  UserRoundXIcon,
  UsersIcon,
  Volume2Icon,
} from "lucide-react";

import { formatCount } from "@/lib/admin/format";
import { formatMinutes, type SessionMetrics } from "@/lib/admin/metrics";
import { Card, CardContent } from "@/components/ui/card";

export function SessionMetricsGrid({ metrics }: { metrics: SessionMetrics }) {
  const cards = [
    {
      label: "Na fila",
      value: formatCount(metrics.waiting),
      hint: "Aguardando chamada",
      icon: UsersIcon,
    },
    {
      label: "Chamados",
      value: formatCount(metrics.called),
      hint: "Senha no confessionário",
      icon: Volume2Icon,
    },
    {
      label: "Em atendimento",
      value: formatCount(metrics.in_service),
      hint: `${formatCount(metrics.active_stations)} confessionário(s) ativo(s)`,
      icon: UserCheckIcon,
    },
    {
      label: "Concluídos",
      value: formatCount(metrics.completed),
      hint: `${formatCount(metrics.no_show)} no-show · ${formatCount(metrics.cancelled)} cancelados`,
      icon: TicketIcon,
    },
    {
      label: "Total de senhas",
      value: formatCount(metrics.total),
      hint: "Emitidas nesta sessão",
      icon: ClockIcon,
    },
    {
      label: "Espera média",
      value: formatMinutes(metrics.average_wait_minutes),
      hint: "Até a primeira chamada",
      icon: HourglassIcon,
    },
    {
      label: "Atendimento médio",
      value: formatMinutes(metrics.average_service_minutes),
      hint: "Duração no confessionário",
      icon: TimerIcon,
    },
    {
      label: "Não compareceram",
      value: formatCount(metrics.no_show),
      hint: "Senhas chamadas sem presença",
      icon: UserRoundXIcon,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} size="sm">
            <CardContent className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {card.label}
                </p>
                <p className="font-heading mt-1 text-3xl leading-none tabular-nums">
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
