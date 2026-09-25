"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { useTicket } from "@/hooks/use-ticket";
import { Button } from "@/components/ui/button";
import { mapQueueError } from "@/lib/queue/errors";
import type { FielTicket } from "@/lib/queue/types";
import { createAnonClient } from "@/lib/supabase/anon";

export function JoinQueueButton({
  sessionId,
  slug,
  disabled,
}: {
  sessionId: string;
  slug: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { ticket, saveTicket } = useTicket();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const lock = useInFlightLock();

  function join() {
    if (!lock.tryAcquire()) return;

    startTransition(async () => {
      try {
        setError(null);
        const supabase = createAnonClient();

        const existingToken =
          ticket?.sessionId === sessionId ? ticket.anonymousToken : undefined;

        const { data, error: rpcError } = await supabase.rpc("create_ticket", {
          p_session_id: sessionId,
          p_existing_token: existingToken,
        });

        if (rpcError || !data) {
          const message = mapQueueError(
            rpcError?.message,
            "Não foi possível entrar na fila.",
          );
          setError(message);
          toast.error(message);
          return;
        }

        const fielTicket = data as FielTicket;

        if (
          !fielTicket.session_id ||
          !fielTicket.anonymous_token ||
          !fielTicket.public_code
        ) {
          setError("Resposta inválida do servidor.");
          return;
        }

        saveTicket({
          sessionId: fielTicket.session_id,
          anonymousToken: fielTicket.anonymous_token,
          publicCode: fielTicket.public_code,
        });

        toast.success(`Sua senha é ${fielTicket.public_code}`);
        router.push(`/s/${slug}/minha-senha`);
      } finally {
        lock.release();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="h-16 w-full touch-manipulation text-lg font-semibold active:scale-[0.99]"
        disabled={disabled || pending}
        onClick={join}
      >
        {pending ? "Entrando na fila..." : "Entrar na fila"}
      </Button>
    </div>
  );
}
