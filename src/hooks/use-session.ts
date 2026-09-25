"use client";

import { usePublicSession } from "@/hooks/use-public-session";

export function useSession(slug?: string) {
  const result = usePublicSession(slug ?? "");
  return {
    session: result.state?.session ?? null,
    isLoading: slug ? result.isLoading : false,
    error: result.error,
  };
}
