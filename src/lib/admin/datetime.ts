export const AMERICA_SAO_PAULO = "America/Sao_Paulo";

const LOCAL_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function timeZoneOffsetMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - instant.getTime();
}

function brazilParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: AMERICA_SAO_PAULO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export function brazilLocalInputToIso(localValue: string) {
  const match = LOCAL_INPUT_PATTERN.exec(localValue.trim());
  if (!match) {
    throw new Error("Data inválida");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = timeZoneOffsetMs(new Date(utcGuess), AMERICA_SAO_PAULO);
  let utcMs = utcGuess - firstOffset;
  const secondOffset = timeZoneOffsetMs(new Date(utcMs), AMERICA_SAO_PAULO);
  if (secondOffset !== firstOffset) {
    utcMs = utcGuess - secondOffset;
  }

  const result = new Date(utcMs);
  if (Number.isNaN(result.getTime())) {
    throw new Error("Data inválida");
  }

  return result.toISOString();
}

export function isoToBrazilLocalInput(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = brazilParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function addHoursToBrazilLocalInput(localValue: string, hours: number) {
  const iso = brazilLocalInputToIso(localValue);
  return isoToBrazilLocalInput(new Date(new Date(iso).getTime() + hours * 3_600_000));
}

export function nextFullHourBrazilLocalInput(from = new Date()) {
  const current = isoToBrazilLocalInput(from);
  const [datePart, timePart] = current.split("T");
  const hour = Number(timePart.slice(0, 2));
  const onTheHour = `${datePart}T${pad(hour)}:00`;
  return addHoursToBrazilLocalInput(onTheHour, 1);
}

export function isPastInBrazil(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

export function isSameBrazilDay(value: string, from = new Date()) {
  const left = brazilParts(new Date(value));
  const right = brazilParts(from);
  return left.year === right.year && left.month === right.month && left.day === right.day;
}
