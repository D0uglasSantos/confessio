import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Preparação</CardTitle>
        <CardDescription>
          Marque o caminho até abrir a fila. Os itens com link já podem ser
          feitos agora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2">
          {items.map((item) => {
            const Icon = item.done ? CheckCircle2Icon : CircleIcon;
            return (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <Icon
                  className={
                    item.done
                      ? "text-brand-sage mt-0.5 size-4"
                      : "text-muted-foreground mt-0.5 size-4"
                  }
                />
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:underline underline-offset-4"
                    target={item.href.startsWith("/") ? "_blank" : undefined}
                    rel={item.href.startsWith("/") ? "noreferrer" : undefined}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            );
          })}
            </ol>
      </CardContent>
    </Card>
  );
}
