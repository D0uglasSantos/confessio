import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAdminDateTime } from "@/lib/admin/format";

export type AuditLogEntry = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: unknown;
  created_at: string;
};

const actionLabel: Record<string, string> = {
  "church.create": "Paróquia cadastrada",
  "church.update": "Paróquia atualizada",
  "church.activate": "Paróquia reativada",
  "church.deactivate": "Paróquia desativada",
  "church_admin.assign": "Admin vinculado à paróquia",
};

function describeMetadata(action: string, metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const data = metadata as Record<string, unknown>;

  if (action === "church.create" && typeof data.name === "string") {
    return data.name;
  }

  if (action === "church.update" && typeof data.name === "string") {
    return data.name;
  }

  if (
    action === "church_admin.assign" &&
    typeof data.assigned_user_id === "string"
  ) {
    return `usuário ${data.assigned_user_id}`;
  }

  return null;
}

export function AuditLogList({
  entries,
  showViewAll = false,
}: {
  entries: AuditLogEntry[];
  showViewAll?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
        <CardDescription>
          Ações da plataforma. Nunca inclui dados de fiéis ou conteúdo de
          confissão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma ação registrada ainda.
          </p>
        ) : (
          <ol>
            {entries.map((entry) => {
              const detail = describeMetadata(entry.action, entry.metadata);
              return (
                <li
                  key={entry.id}
                  className="before:bg-primary/50 after:bg-border relative border-b py-2.5 pl-5 before:absolute before:top-3.5 before:left-0 before:size-2 before:rounded-full after:absolute after:top-6 after:bottom-0 after:left-[0.1875rem] after:w-px last:border-0 last:after:hidden"
                >
                  <p className="text-sm">
                    {actionLabel[entry.action] ?? entry.action}
                    {detail ? (
                      <span className="text-muted-foreground"> — {detail}</span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatAdminDateTime(entry.created_at)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
      {showViewAll ? (
        <CardFooter>
          <Link
            href="/admin/global/atividade"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Ver toda a atividade
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}
