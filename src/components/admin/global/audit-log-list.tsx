import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAdminDateTime } from "@/lib/admin/format";

type AuditLogEntry = {
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

export function AuditLogList({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atividade recente</CardTitle>
        <CardDescription>
          Ações administrativas de plataforma. Nunca inclui dados de fiéis ou
          conteúdo de confissão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma ação registrada ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => {
              const detail = describeMetadata(entry.action, entry.metadata);
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span>
                    {actionLabel[entry.action] ?? entry.action}
                    {detail ? (
                      <span className="text-muted-foreground"> — {detail}</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAdminDateTime(entry.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
