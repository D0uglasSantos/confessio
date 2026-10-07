"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatAdminTime } from "@/lib/admin/format";
import { ticketStatusLabel } from "@/lib/admin/labels";
import type { AdminSessionTicket, TicketStatus } from "@/lib/admin/metrics";
import { cn } from "cn";

const filters: Array<{ id: "all" | TicketStatus; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "WAITING", label: "Aguardando" },
  { id: "CALLED", label: "Chamada" },
  { id: "IN_SERVICE", label: "Em atendimento" },
  { id: "COMPLETED", label: "Concluída" },
  { id: "NO_SHOW", label: "Ausente" },
  { id: "CANCELLED", label: "Cancelada" },
];

export function SessionTicketTable({
  tickets,
}: {
  tickets: AdminSessionTicket[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]["id"]>("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (status !== "all" && ticket.status !== status) return false;
      if (!normalized) return true;
      return ticket.public_code.toLowerCase().includes(normalized);
    });
  }, [query, status, tickets]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar senha"
            className="pl-8"
            aria-label="Buscar senha"
          />
        </div>
        <div
          className="flex flex-wrap gap-1"
          role="tablist"
          aria-label="Filtrar senhas"
        >
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={status === item.id}
              onClick={() => setStatus(item.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                status === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-background text-muted-foreground sticky top-0 border-b text-[11px] tracking-[0.08em] uppercase">
            <tr>
              <th scope="col" className="px-3 py-3 font-medium">
                Senha
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Entrada
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Chamada
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                Rechamadas
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-3 py-8 text-center"
                >
                  Nenhuma senha nesta sessão ainda.
                </td>
              </tr>
            ) : (
              filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-primary/4 border-b border-border/70 last:border-0"
                >
                  <td className="px-3 py-2.5 font-medium tabular-nums">
                    {ticket.public_code}
                  </td>
                  <td className="px-3 py-2.5">
                    {ticketStatusLabel[ticket.status] ?? ticket.status}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 tabular-nums">
                    {formatAdminTime(ticket.created_at)}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 tabular-nums">
                    {ticket.called_at ? formatAdminTime(ticket.called_at) : "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-right tabular-nums">
                    {ticket.recall_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
