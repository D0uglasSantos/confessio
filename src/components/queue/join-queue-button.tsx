"use client";

import { MessageCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { startNavigationProgress } from "@/components/navigation-progress";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";
import { useTicket } from "@/hooks/use-ticket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhoneInput, phoneInputToRpc } from "@/lib/queue/phone";
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
  const [phone, setPhone] = useState("");
  const lock = useInFlightLock();

  function join() {
    if (!lock.tryAcquire()) return;

    startTransition(async () => {
      try {
        setError(null);
        const supabase = createAnonClient();
        const phoneE164 = phoneInputToRpc(phone);

        const existingToken =
          ticket?.sessionId === sessionId ? ticket.anonymousToken : undefined;

        const { data, error: rpcError } = await supabase.rpc("create_ticket", {
          p_session_id: sessionId,
          p_existing_token: existingToken,
          p_phone_e164: phoneE164,
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
          wantsWhatsapp: Boolean(phoneE164),
        });

        toast.success(`Sua senha é ${fielTicket.public_code}`);
        startNavigationProgress();
        router.push(`/s/${slug}/minha-senha`);
      } finally {
        lock.release();
      }
    });
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        join();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="join-phone" className="text-base font-semibold">
          Receber aviso no WhatsApp{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Se quiser, avisamos no WhatsApp quando for a sua vez. O número não
          aparece no telão.
        </p>
        <div className="relative">
          <MessageCircleIcon
            aria-hidden
            className="text-primary pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <Input
            id="join-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(61) 99999-9999"
            value={phone}
            onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
            disabled={disabled || pending}
            className="h-14 rounded-full pl-12 text-base"
          />
        </div>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="h-14 w-full touch-manipulation rounded-full text-base font-semibold active:scale-[0.99]"
        loading={pending}
        disabled={disabled}
      >
        {pending ? "Entrando na fila..." : "Entrar na fila"}
      </Button>
    </form>
  );
}
