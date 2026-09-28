"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import {
  countSessionsByFilter,
  matchesSessionFilter,
  parseSessionDirectoryFilter,
  sessionDirectoryFilters,
  type SessionDirectoryFilter,
  type ParishSessionSummary,
} from "@/components/admin/parish/session-helpers";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAdminDateTime, formatCount } from "@/lib/admin/format";

const PAGE_SIZE = 12;

export function SessionDirectory({
  sessions,
}: {
  sessions: ParishSessionSummary[];
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

      return (
        session.name.toLowerCase().includes(normalized) ||
        session.slug.toLowerCase().includes(normalized)
      );
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
          placeholder="Buscar por nome ou slug"
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
            <Link
              href="/admin/sessoes/nova"
              className={buttonVariants({ className: "mt-4" })}
            >
              Nova sessão
            </Link>
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
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b text-xs tracking-wide uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Sessão</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Início</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-muted/30 border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{session.name}</p>
                      <p className="text-muted-foreground text-xs">
                        /s/{session.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <SessionStatusBadge status={session.status} />
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {session.starts_at
                        ? formatAdminDateTime(session.starts_at)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/sessoes/${session.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {filtered.length > PAGE_SIZE ? (
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
          <p>
            {formatCount(filtered.length)} sessão(ões) · página {currentPage} de{" "}
            {pageCount}
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
          {formatCount(filtered.length)} sessão(ões)
        </p>
      ) : null}
    </div>
  );
}
