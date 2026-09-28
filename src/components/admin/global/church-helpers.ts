import type { GlobalChurchSummary } from "@/lib/admin/global-metrics";

export type ChurchDirectoryFilter =
  "all" | "ativas" | "desativadas" | "sem-admin" | "fila-ativa";

export const churchDirectoryFilters: Array<{
  id: ChurchDirectoryFilter;
  label: string;
}> = [
  { id: "all", label: "Todas" },
  { id: "ativas", label: "Ativas" },
  { id: "desativadas", label: "Desativadas" },
  { id: "sem-admin", label: "Sem admin" },
  { id: "fila-ativa", label: "Fila ativa" },
];

export function parseChurchDirectoryFilter(
  value: string | null,
): ChurchDirectoryFilter {
  if (
    value === "ativas" ||
    value === "desativadas" ||
    value === "sem-admin" ||
    value === "fila-ativa"
  ) {
    return value;
  }

  return "all";
}

export function churchInitials(name: string) {
  const withoutPrefix = name.replace(/^paróquia\s+/i, "").trim();
  const words = withoutPrefix.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function matchesChurchFilter(
  church: GlobalChurchSummary,
  filter: ChurchDirectoryFilter,
) {
  switch (filter) {
    case "ativas":
      return church.is_active;
    case "desativadas":
      return !church.is_active;
    case "sem-admin":
      return church.admins_count === 0;
    case "fila-ativa":
      return church.sessions_open_now > 0;
    default:
      return true;
  }
}

export function countChurchesByFilter(
  churches: GlobalChurchSummary[],
  filter: ChurchDirectoryFilter,
) {
  if (filter === "all") {
    return churches.length;
  }

  return churches.filter((church) => matchesChurchFilter(church, filter))
    .length;
}

export function getChurchAttention(churches: GlobalChurchSummary[]) {
  return {
    live: churches.filter((church) => church.sessions_open_now > 0),
    noAdmin: churches.filter(
      (church) => church.is_active && church.admins_count === 0,
    ),
    neverUsed: churches.filter(
      (church) =>
        church.is_active &&
        church.sessions_total === 0 &&
        church.admins_count > 0,
    ),
    inactive: churches.filter((church) => !church.is_active),
  };
}
