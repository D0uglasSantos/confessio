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
import { Card, CardContent } from "@/components/ui/card";
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

      <div className="flex flex-wrap gap-1.5">
        {sessionDirectoryFilters.map((item) => {
          const count = countSessionsByFilter(sessions, item.id);
          const selected = filter === item.id;

          return (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span className="tabular-nums opacity-80">{count}</span>
            </Button>
          );
        })}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Nenhuma sessão criada</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Crie a primeira sessão para abrir a fila de confissões.
            </p>
            {canCreate ? (
              <Link
                href="/admin/sessoes/nova"
                className={buttonVariants({ className: "mt-4" })}
              >
                Nova sessão
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Nenhuma sessão encontrada nesta busca ou filtro.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b text-xs tracking-wide uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Sessão
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Início
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Emitidas
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Atendidas
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Duração
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
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
                      className="hover:bg-muted/30 relative border-b last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/sessoes/${session.id}`}
                          className="after:absolute after:inset-0 font-medium focus-visible:ring-ring/50 rounded-sm focus-visible:ring-3 focus-visible:outline-none"
                        >
                          {session.name}
                        </Link>
                        {pastDraft ? (
                          <p className="text-amber-800 relative z-10 mt-1 text-xs">
                            Horário já passou
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <SessionStatusBadge status={session.status} />
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {session.starts_at
                          ? formatAdminDateTime(session.starts_at)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {session.tickets_issued ?? 0}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {session.tickets_completed ?? 0}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {duration == null ? "—" : formatDuration(duration)}
                      </td>
                      <td className="relative z-10 px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            href={`/admin/sessoes/${session.id}`}
                            className={buttonVariants({
                              variant: "outline",
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
          </CardContent>
        </Card>
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
