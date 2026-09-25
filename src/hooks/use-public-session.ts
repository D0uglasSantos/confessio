"use client";

import { useEffect, useState } from "react";

import { mapQueueError } from "@/lib/queue/errors";
import {
  parsePublicSessionState,
  type PublicSessionState,
} from "@/lib/queue/types";
import { createAnonClient } from "@/lib/supabase/anon";

const POLL_MS = 3000;

export function usePublicSession(slug: string) {
  const [state, setState] = useState<PublicSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createAnonClient();

    async function load() {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          "get_public_session_state",
          { p_slug: slug },
        );

        if (!active) return;

        if (rpcError) {
          setError(mapQueueError(rpcError.message, "Sessão indisponível."));
          setState(null);
          return;
        }

        const parsed = parsePublicSessionState(data);
        if (!parsed) {
          setError("Sessão não encontrada.");
          setState(null);
          return;
        }

        setError(null);
        setState(parsed);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Falha ao carregar a sessão.";
        setError(mapQueueError(message, "Sessão indisponível."));
        setState(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    const pollId = window.setInterval(() => {
      void load();
    }, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(pollId);
    };
  }, [slug]);

  return { state, error, isLoading };
}
