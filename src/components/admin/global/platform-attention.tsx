import Link from "next/link";
import { AlertTriangleIcon, RadioIcon } from "lucide-react";

import { getChurchAttention } from "@/components/admin/global/church-helpers";
import { Badge } from "@/components/ui/badge";
import { formatCounted } from "@/lib/admin/format";
import type { GlobalChurchSummary } from "@/lib/admin/global-metrics";

export function PlatformAttention({
  churches,
}: {
  churches: GlobalChurchSummary[];
}) {
  const { live, noAdmin, neverUsed, inactive } = getChurchAttention(churches);
  const hasAttention =
    noAdmin.length > 0 || neverUsed.length > 0 || inactive.length > 0;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-heading text-xl">Agora</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Filas ao vivo e pontos que pedem ação do administrador da plataforma.
        </p>
      </div>
      <AttentionGroup
        icon={RadioIcon}
        title="Fila ativa agora"
        empty="Nenhuma paróquia com sessão aberta neste momento."
        items={live.map((church) => ({
          id: church.id,
          name: church.name,
          detail: formatCounted(church.sessions_open_now, {
            one: "sessão aberta",
            other: "sessões abertas",
          }),
          href: "/admin/global/paroquias?filtro=fila-ativa",
        }))}
      />

      {hasAttention ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangleIcon className="text-warning size-4" />
            Precisam de atenção
          </p>
          {noAdmin.length > 0 ? (
            <AttentionGroup
              title="Sem admin local"
              items={noAdmin.map((church) => ({
                id: church.id,
                name: church.name,
                detail: "Cadastre o usuário da secretaria",
                href: "/admin/global/paroquias?filtro=sem-admin",
              }))}
            />
          ) : null}
          {neverUsed.length > 0 ? (
            <AttentionGroup
              title="Ainda sem uso"
              items={neverUsed.map((church) => ({
                id: church.id,
                name: church.name,
                detail: "Nenhuma sessão criada",
                href: "/admin/global/paroquias?filtro=ativas",
              }))}
            />
          ) : null}
          {inactive.length > 0 ? (
            <AttentionGroup
              title="Desativadas"
              items={inactive.map((church) => ({
                id: church.id,
                name: church.name,
                detail: "Fora de operação",
                href: "/admin/global/paroquias?filtro=desativadas",
              }))}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Nenhum ponto de atenção. As paróquias ativas têm admin local.
        </p>
      )}
    </section>
  );
}

function AttentionGroup({
  icon: Icon,
  title,
  empty,
  items,
}: {
  icon?: typeof RadioIcon;
  title: string;
  empty?: string;
  items: Array<{ id: string; name: string; detail: string; href: string }>;
}) {
  if (items.length === 0 && empty) {
    return (
      <div>
        <p className="flex items-center gap-2 text-sm font-medium">
          {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
          {title}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{empty}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <ul className="divide-y divide-border/70">
        {items.slice(0, 4).map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="hover:bg-primary/4 flex items-baseline justify-between gap-3 rounded-lg px-1 py-2 text-sm"
            >
              <span className="truncate font-medium">{item.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {item.detail}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
