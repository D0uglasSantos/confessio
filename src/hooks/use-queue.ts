"use client";

import { usePublicSession } from "@/hooks/use-public-session";

export function useQueue(slug?: string) {
  const result = usePublicSession(slug ?? "");
  return {
    waitingCount: result.state?.waiting_count ?? 0,
    isLoading: slug ? result.isLoading : false,
  };
}
