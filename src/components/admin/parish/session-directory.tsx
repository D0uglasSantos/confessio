"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { DuplicateSessionButton } from "@/components/admin/duplicate-session-button";
import {
  countSessionsByFilter,
  matchesSessionFilter,
  parseSessionDirectoryFilter,
  sessionDirectoryFilters,
  type SessionDirectoryFilter,
  type ParishSessionSummary,
} from "@/components/admin/parish/session-helpers";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { startNavigationProgress } from "@/components/navigation-progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { isPastInBrazil } from "@/lib/admin/datetime";
import { formatAdminDateTime, formatCounted } from "@/lib/admin/format";
import { formatDuration } from "@/lib/admin/metrics";

const PAGE_SIZE = 12;

function sessionDurationMinutes(session: ParishSessionSummary) {
  if (!session.entry_opened_at || !session.finished_at) return null;
  const start = new Date(session.entry_opened_at).getTime();
  const end = new Date(session.finished_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return (end - start) / 60_000;
}

export function SessionDirectory({
  sessions,
  canCreate = true,
}: {
  sessions: ParishSessionSummary[];
  canCreate?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filter = parseSessionDirectoryFilter(searchParams.get("filtro"));

  function setFilter(next: SessionDirectoryFilter) {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("filtro");
    } else {
      params.set("filtro", next);
    }
    const search = params.toString();
    startNavigationProgress();
    router.replace(search ? `/admin/sessoes?${search}` : "/admin/sessoes", {
      scroll: false,
    });
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return sessions.filter((session) => {
      if (!matchesSessionFilter(session, filter)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return session.name.toLowerCase().includes(normalized);
    });
  }, [filter, query, sessions]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar sessão"
            className="pl-8"
            aria-label="Buscar sessão"
          />
        </div>

        <div
          className="bg-secondary/80 inline-flex flex-wrap items-center gap-0.5 rounded-xl p-1"
          role="tablist"
          aria-label="Filtrar por status"
        >
          {sessionDirectoryFilters.map((item) => {
            const count = countSessionsByFilter(sessions, item.id);
            const selected = filter === item.id;

            return (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={selected ? "secondary" : "ghost"}
                className={selected ? "bg-card shadow-none" : "border-transparent"}
                aria-pressed={selected}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Nenhuma sessão criada"
          description="Crie a primeira sessão para abrir a fila de confissões."
          action={
            canCreate ? (
              <Link href="/admin/sessoes/nova" className={buttonVariants()}>
                Nova sessão
              </Link>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nada encontrado"
          description="Nenhuma sessão corresponde a esta busca ou filtro."
        />
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="text-muted-foreground border-b text-[11px] tracking-[0.08em] uppercase">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Sessão
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Início
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Emitidas
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Atendidas
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Duração
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((session) => {
                  const pastDraft =
                    session.status === "DRAFT" && isPastInBrazil(session.starts_at);
                  const duration = sessionDurationMinutes(session);

                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-primary/4 group relative border-b border-border/70 last:border-0"
                    >
                      <td className="px-3 py-3.5">
                        <Link
                          href={`/admin/sessoes/${session.id}`}
                          className="after:absolute after:inset-0 font-medium focus-visible:ring-ring/50 rounded-sm focus-visible:ring-3 focus-visible:outline-none"
                        >
                          {session.name}
                        </Link>
                        {pastDraft ? (
                          <p className="text-warning relative z-10 mt-1 text-xs">
                            Horário já passou
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5">
                        <SessionStatusBadge status={session.status} />
                      </td>
                      <td className="text-muted-foreground px-3 py-3.5">
                        {session.starts_at
                          ? formatAdminDateTime(session.starts_at)
                          : "—"}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums">
                        {session.tickets_issued ?? 0}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums">
                        {session.tickets_completed ?? 0}
                      </td>
                      <td className="text-muted-foreground px-3 py-3.5 text-right tabular-nums">
                        {duration == null ? "—" : formatDuration(duration)}
                      </td>
                      <td className="relative z-10 px-3 py-3.5">
                        <div className="flex flex-wrap justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                          <Link
                            href={`/admin/sessoes/${session.id}`}
                            className={buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            Abrir
                          </Link>
                          {canCreate ? (
                            <DuplicateSessionButton sessionId={session.id} />
                          ) : null}
                          {pastDraft ? (
                            <Link
                              href={`/admin/sessoes/${session.id}#reagendar`}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                              })}
                            >
                              Reagendar
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}

      {filtered.length > PAGE_SIZE ? (
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
          <p>
            {formatCounted(filtered.length, { one: "sessão", other: "sessões" })}{" "}
            · página {currentPage} de {pageCount}
          </p>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Próxima
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          {formatCounted(filtered.length, { one: "sessão", other: "sessões" })}
        </p>
      ) : null}
    </div>
  );
}
