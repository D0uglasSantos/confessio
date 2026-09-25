"use client";

import { useCallback, useEffect, useState } from "react";

import { mapQueueError } from "@/lib/queue/errors";
import { parseStationState, type StationState } from "@/lib/queue/types";
import { createAnonClient } from "@/lib/supabase/anon";

const POLL_MS = 3000;

export function useStationState(stationId: string, accessToken: string | null) {
  const [state, setState] = useState<StationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) {
      setError("Token de acesso ausente. Use o link do painel do admin.");
      setState(null);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createAnonClient();
      const { data, error: rpcError } = await supabase.rpc("get_station_state", {
        p_station_id: stationId,
        p_access_token: accessToken,
      });

      if (rpcError) {
        setError(
          mapQueueError(
            rpcError.message,
            "Não foi possível ler o confessionário.",
          ),
        );
        setState(null);
        return;
      }

      const parsed = parseStationState(data);
      if (!parsed) {
        setError("Não foi possível ler o estado do confessionário.");
        setState(null);
        return;
      }

      setError(null);
      setState(parsed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao carregar confessionário.";
      setError(mapQueueError(message, "Não foi possível ler o confessionário."));
      setState(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, stationId]);

  useEffect(() => {
    let active = true;

    async function run() {
      if (!active) return;
      await load();
    }

    void run();
    const pollId = window.setInterval(() => {
      void run();
    }, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(pollId);
    };
  }, [load]);

  return { state, error, isLoading, refresh: load };
}
