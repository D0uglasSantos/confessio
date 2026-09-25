"use client";

import { useSyncExternalStore } from "react";

import {
  clearStoredTicket,
  readStoredTicket,
  writeStoredTicket,
  type StoredTicket,
} from "@/lib/queue/ticket";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("confession-ticket-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("confession-ticket-change", onStoreChange);
  };
}

function saveTicket(next: StoredTicket) {
  writeStoredTicket(next);
  window.dispatchEvent(new Event("confession-ticket-change"));
}

function clearTicket() {
  clearStoredTicket();
  window.dispatchEvent(new Event("confession-ticket-change"));
}

export function useTicket() {
  const ticket = useSyncExternalStore(
    subscribe,
    readStoredTicket,
    () => null,
  );

  return {
    ticket,
    saveTicket,
    clearTicket,
  };
}
