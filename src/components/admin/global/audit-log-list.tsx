import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AuditLogEntry } from "@/lib/admin/global-metrics";

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

  if (action === "church.deactivate" && typeof data.name === "string") {
    return data.name;
  }

  if (action === "church.activate" && typeof data.name === "string") {
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
  loadError = false,
}: {
  entries: AuditLogEntry[];
  showViewAll?: boolean;
  loadError?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-xl">Atividade recente</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Ações da plataforma. Nunca inclui dados de fiéis ou conteúdo de
          confissão.
        </p>
      </div>
      {loadError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar o registro de atividade. Tente de novo em
          instantes.
        </p>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhuma ação registrada ainda"
          description="Cadastrar paróquia, editar, vincular admin ou ativar/desativar aparece aqui."
          action={
            <Link
              href="/admin/global/paroquias"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ir para paróquias
            </Link>
          }
        />
      ) : (
        <ol>
          {entries.map((entry) => {
            const detail = describeMetadata(entry.action, entry.metadata);
            return (
              <li
                key={entry.id}
                className="before:bg-primary/50 after:bg-border relative border-b border-border/70 py-3 pl-5 before:absolute before:top-4 before:left-0 before:size-2 before:rounded-full after:absolute after:top-6 after:bottom-0 after:left-[0.1875rem] after:w-px last:border-0 last:after:hidden"
              >
                <p className="text-sm">
                  {actionLabel[entry.action] ?? entry.action}
                  {detail ? (
                    <span className="text-muted-foreground"> — {detail}</span>
                  ) : null}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatAdminDateTime(entry.created_at)}
                  {entry.actor_email ? ` · ${entry.actor_email}` : null}
                </p>
              </li>
            );
          })}
        </ol>
      )}
      {showViewAll ? (
        <Link
          href="/admin/global/atividade"
          className="text-muted-foreground hover:text-foreground inline-block text-sm underline-offset-4 hover:underline"
        >
          Ver toda a atividade
        </Link>
      ) : null}
    </section>
  );
}
