import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import Link from "next/link";

import type { SessionStatus } from "@/lib/admin/metrics";

export function SessionPrepChecklist({
  sessionId,
  status,
  stationCount,
  hasPrintableStations,
}: {
  sessionId: string;
  status: SessionStatus;
  stationCount: number;
  hasPrintableStations: boolean;
}) {
  if (status !== "DRAFT") return null;

  const items = [
    {
      done: stationCount > 0,
      label: "Confessionários cadastrados",
      href: "#confessionarios",
    },
    {
      done: hasPrintableStations,
      label: "Cartões de mesa prontos para imprimir",
      href: `/admin/sessoes/${sessionId}/imprimir/confessionarios`,
    },
    {
      done: false,
      label: "Cartaz com QR impresso",
      href: `/admin/sessoes/${sessionId}/imprimir/cartaz`,
    },
    {
      done: false,
      label: "Abrir a fila quando a equipe estiver pronta",
    },
  ];

  return (
    <ol className="relative space-y-0 border-l border-border/80 pl-5">
      {items.map((item) => {
        const Icon = item.done ? CheckCircle2Icon : CircleIcon;
        return (
          <li key={item.label} className="relative pb-5 last:pb-0">
            <Icon
              className={
                item.done
                  ? "text-brand-sage absolute top-0.5 -left-[1.6rem] size-4 bg-background"
                  : "text-muted-foreground absolute top-0.5 -left-[1.6rem] size-4 bg-background"
              }
            />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:underline text-sm underline-offset-4"
                target={item.href.startsWith("/") ? "_blank" : undefined}
                rel={item.href.startsWith("/") ? "noreferrer" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm">{item.label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
