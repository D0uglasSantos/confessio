export const TICKET_STORAGE_KEY = "confession_ticket";

export type StoredTicket = {
  sessionId: string;
  anonymousToken: string;
  publicCode: string;
  wantsWhatsapp?: boolean;
};

let cachedRaw: string | null | undefined;
let cachedTicket: StoredTicket | null = null;

export function formatPublicCode(prefix: string, publicNumber: number) {
  const digits = Math.max(3, String(publicNumber).length);
  return `${prefix}-${String(publicNumber).padStart(digits, "0")}`;
}

export function readStoredTicket(): StoredTicket | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(TICKET_STORAGE_KEY);

  // useSyncExternalStore exige referência estável enquanto o valor não muda.
  if (raw === cachedRaw) {
    return cachedTicket;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedTicket = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredTicket;

    if (!parsed.sessionId || !parsed.anonymousToken || !parsed.publicCode) {
      cachedTicket = null;
      return null;
    }

    cachedTicket = parsed;
    return cachedTicket;
  } catch {
    cachedTicket = null;
    return null;
  }
}

export function writeStoredTicket(ticket: StoredTicket) {
  const raw = JSON.stringify(ticket);
  window.localStorage.setItem(TICKET_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedTicket = ticket;
}

export function clearStoredTicket() {
  window.localStorage.removeItem(TICKET_STORAGE_KEY);
  cachedRaw = null;
  cachedTicket = null;
}
