"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTicket } from "@/hooks/use-ticket";
import { mapQueueError } from "@/lib/queue/errors";
import { estimateWaitMinutes } from "@/lib/queue/estimated-wait";
import { computeQueuePosition } from "@/lib/queue/position";
import {
  countActiveStations,
  deriveFaithfulView,
  type FielTicket,
  type PublicSessionState,
  type TicketStatus,
} from "@/lib/queue/types";
import { createAnonClient } from "@/lib/supabase/anon";

const POLL_MS = 3000;

export function useFaithfulTicket(
  session: PublicSessionState["session"] | null,
) {
  const { ticket: stored, saveTicket, clearTicket } = useTicket();
  const [remote, setRemote] = useState<FielTicket | null>(null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [averageServiceMinutes, setAverageServiceMinutes] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);

  const belongsToSession =
    !!session && !!stored && stored.sessionId === session.id;

  const refresh = useCallback(async () => {
    if (!session || !stored || stored.sessionId !== session.id) {
      return;
    }

    const supabase = createAnonClient();
    const token = stored.anonymousToken;

    try {
      const { data, error: ticketError } = await supabase.rpc(
        "get_ticket_by_token",
        { p_token: token },
      );

      if (ticketError || !data) {
        setError(mapQueueError(ticketError?.message, "Ticket não encontrado."));
        setRemote(null);
        setLoadedToken(token);
        return;
      }

      setRemote(data);
      setError(null);
      setLoadedToken(token);

      if (data.public_code && data.public_code !== stored.publicCode) {
        saveTicket({
          sessionId: stored.sessionId,
          anonymousToken: stored.anonymousToken,
          publicCode: data.public_code,
        });
      }

      if (data.status === "WAITING" && data.public_number != null) {
        const { count } = await supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id)
          .eq("status", "WAITING")
          .lt("public_number", data.public_number);

        setPeopleAhead(count ?? 0);
      } else {
        setPeopleAhead(0);
      }

      const { data: completed } = await supabase
        .from("tickets")
        .select("started_at, finished_at")
        .eq("session_id", session.id)
        .eq("status", "COMPLETED")
        .not("started_at", "is", null)
        .not("finished_at", "is", null)
        .limit(30);

      if (completed && completed.length > 0) {
        const durations = completed
          .map((row) => {
            if (!row.started_at || !row.finished_at) return null;
            return (
              (new Date(row.finished_at).getTime() -
                new Date(row.started_at).getTime()) /
              60000
            );
          })
          .filter((value): value is number => value !== null && value > 0);

        if (durations.length > 0) {
          const average =
            durations.reduce((sum, value) => sum + value, 0) / durations.length;
          setAverageServiceMinutes(Math.max(1, Math.round(average)));
        }
      } else {
        setAverageServiceMinutes(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao carregar a senha.";
      setError(mapQueueError(message, "Ticket não encontrado."));
      setRemote(null);
      setLoadedToken(token);
    }
  }, [saveTicket, session, stored]);

  useEffect(() => {
    if (!session || !belongsToSession || !stored) {
      return;
    }

    let active = true;

    async function run() {
      if (!active) return;
      await refresh();
    }

    void run();
    const pollId = window.setInterval(() => {
      void run();
    }, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(pollId);
    };
  }, [belongsToSession, refresh, session, stored]);

  useEffect(() => {
    if (!remote?.status || remote.status !== "CALLED") return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([200, 100, 200, 100, 400]);
    }
  }, [remote?.called_at, remote?.status]);

  const position = computeQueuePosition(
    remote?.public_number ?? 0,
    peopleAhead,
  );

  const view = deriveFaithfulView(
    remote?.status as TicketStatus | null,
    peopleAhead,
  );

  const isLoading =
    !!session && belongsToSession && loadedToken !== stored?.anonymousToken;

  return {
    stored: belongsToSession ? stored : null,
    remote,
    peopleAhead,
    position,
    view,
    averageServiceMinutes,
    isLoading,
    error,
    saveTicket,
    clearTicket,
    refresh,
  };
}

export function useEstimatedWait(
  peopleAhead: number,
  stations: PublicSessionState["stations"] | undefined,
  averageServiceMinutes: number | null,
) {
  return useMemo(() => {
    const activeStations = countActiveStations(stations ?? []);
    return estimateWaitMinutes({
      peopleAhead,
      activeStations,
      averageServiceMinutes,
    });
  }, [averageServiceMinutes, peopleAhead, stations]);
}
