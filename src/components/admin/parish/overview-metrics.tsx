import {
  CheckCircle2Icon,
  FilePenIcon,
  ListChecksIcon,
  RadioIcon,
} from "lucide-react";

import { formatCount } from "@/lib/admin/format";
import { Card, CardContent } from "@/components/ui/card";
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

  const cards = [
    {
      label: "Em operação agora",
      value: formatCount(stats.live.length),
      hint:
        stats.live.length === 1
          ? "1 sessão com fila em andamento"
          : `${formatCount(stats.live.length)} sessões com fila em andamento`,
      icon: RadioIcon,
      live: stats.live.length > 0,
    },
    {
      label: "Rascunhos",
      value: formatCount(stats.drafts.length),
      hint: "Prontas para abrir quando a equipe chegar",
      icon: FilePenIcon,
      live: false,
    },
    {
      label: "Encerradas",
      value: formatCount(stats.finished.length),
      hint: "Histórico operacional preservado",
      icon: CheckCircle2Icon,
      live: false,
    },
    {
      label: "Sessões no total",
      value: formatCount(stats.total),
      hint: "Todas as sessões desta paróquia",
      icon: ListChecksIcon,
      live: false,
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
                <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                  {card.label}
                  {card.live ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-emerald-700 normal-case">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      Ao vivo
                    </span>
                  ) : null}
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
