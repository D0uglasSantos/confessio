"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { AssignChurchAdminDialog } from "@/components/admin/global/assign-church-admin-dialog";
import {
  churchDirectoryFilters,
  churchInitials,
  countChurchesByFilter,
  matchesChurchFilter,
  parseChurchDirectoryFilter,
  type ChurchDirectoryFilter,
} from "@/components/admin/global/church-helpers";
import { EditChurchDialog } from "@/components/admin/global/edit-church-dialog";
import { SetChurchActiveButton } from "@/components/admin/global/set-church-active-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAdminDate, formatCount } from "@/lib/admin/format";
import type { GlobalChurchSummary } from "@/lib/admin/global-metrics";

const PAGE_SIZE = 12;

export function ChurchDirectory({
  churches,
}: {
  churches: GlobalChurchSummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filter = parseChurchDirectoryFilter(searchParams.get("filtro"));

  function setFilter(next: ChurchDirectoryFilter) {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("filtro");
    } else {
      params.set("filtro", next);
    }
    const search = params.toString();
    router.replace(
      search ? `/admin/global/paroquias?${search}` : "/admin/global/paroquias",
      { scroll: false },
    );
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return churches.filter((church) => {
      if (!matchesChurchFilter(church, filter)) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        church.name.toLowerCase().includes(normalized) ||
        church.slug.toLowerCase().includes(normalized)
      );
    });
  }, [churches, filter, query]);

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
          aria-label="Buscar paróquia"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {churchDirectoryFilters.map((item) => {
          const count = countChurchesByFilter(churches, item.id);
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

      {churches.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Nenhuma paróquia cadastrada</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Use Nova paróquia para cadastrar a primeira e começar a operar a
              plataforma.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Nenhuma paróquia encontrada nesta busca ou filtro.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b text-xs tracking-wide uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Paróquia</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Uso</th>
                  <th className="px-4 py-3 font-medium">Admins</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((church) => (
                  <tr
                    key={church.id}
                    className="hover:bg-muted/30 border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {church.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={church.logo_url}
                            alt=""
                            className="ring-foreground/10 size-9 rounded-lg object-cover ring-1"
                          />
                        ) : (
                          <span className="bg-primary/10 font-heading text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs">
                            {churchInitials(church.name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{church.name}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            /{church.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {church.is_active ? (
                        <Badge>Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Desativada</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {church.sessions_open_now > 0 ? (
                        <Badge>Fila ativa</Badge>
                      ) : church.sessions_total > 0 ? (
                        <Badge variant="outline">Já usou</Badge>
                      ) : (
                        <Badge variant="secondary">Sem uso</Badge>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {church.sessions_total} sessão(ões)
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="tabular-nums">
                        {formatCount(church.admins_count)}
                      </span>
                      {church.admins_count === 0 ? (
                        <p className="text-xs text-amber-800">Sem vínculo</p>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {church.created_at
                        ? formatAdminDate(church.created_at)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <EditChurchDialog
                          churchId={church.id}
                          name={church.name}
                          slug={church.slug}
                          logoUrl={church.logo_url}
                        />
                        <AssignChurchAdminDialog
                          churchId={church.id}
                          churchName={church.name}
                        />
                        <SetChurchActiveButton
                          churchId={church.id}
                          churchName={church.name}
                          isActive={church.is_active}
                          hasActiveSession={church.sessions_open_now > 0}
                        />
                      </div>
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
            {formatCount(filtered.length)} paróquia(s) · página {currentPage} de{" "}
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
          {formatCount(filtered.length)} paróquia(s)
        </p>
      ) : null}
    </div>
  );
}
