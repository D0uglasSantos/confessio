function formatDateTime(value: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", options).format(date);
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
