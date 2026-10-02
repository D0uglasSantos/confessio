import { AMERICA_SAO_PAULO } from "@/lib/admin/datetime";

function formatDateTime(value: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: AMERICA_SAO_PAULO,
    ...options,
  }).format(date);
}

export function formatAdminDateTime(value: string) {
  return formatDateTime(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminDate(value: string) {
  return formatDateTime(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatAdminDayTime(value: string) {
  return formatDateTime(value, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminTime(value: string) {
  return formatDateTime(value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pluralize(
  count: number,
  forms: { one: string; other: string },
) {
  return count === 1 ? forms.one : forms.other;
}

export function formatCounted(
  count: number,
  forms: { one: string; other: string },
) {
  return `${formatCount(count)} ${pluralize(count, forms)}`;
}
