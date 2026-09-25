"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTicket } from "@/hooks/use-ticket";
import { mapQueueError } from "@/lib/queue/errors";
import { createAnonClient } from "@/lib/supabase/anon";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useClaimTicket(slug: string, claimToken?: string | null) {
  const router = useRouter();
  const { ticket, saveTicket } = useTicket();
  const [status, setStatus] = useState<"idle" | "claiming" | "error">(
    claimToken ? "claiming" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = claimToken?.trim() ?? "";

    if (!token) {
      setStatus("idle");
      setError(null);
      return;
    }

    if (!UUID_RE.test(token)) {
      setStatus("error");
      setError("Este QR não é válido.");
      return;
    }

    if (ticket?.anonymousToken === token) {
      router.replace(`/s/${slug}/minha-senha`);
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("claiming");
    setError(null);

    void (async () => {
      const supabase = createAnonClient();
      const { data, error: rpcError } = await supabase.rpc(
        "get_ticket_by_token",
        { p_token: token },
      );

      if (cancelled) return;

      if (
        rpcError ||
        !data?.session_id ||
        !data.anonymous_token ||
        !data.public_code
      ) {
        setStatus("error");
        setError(
          mapQueueError(
            rpcError?.message,
            "Não foi possível abrir esta senha.",
          ),
        );
        return;
      }

      saveTicket({
        sessionId: data.session_id,
        anonymousToken: data.anonymous_token,
        publicCode: data.public_code,
      });
      router.replace(`/s/${slug}/minha-senha`);
      setStatus("idle");
    })();

    return () => {
      cancelled = true;
    };
  }, [claimToken, router, saveTicket, slug, ticket?.anonymousToken]);

  return {
    claiming: status === "claiming",
    claimError: error,
  };
}