"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { sendChurchAdminResetAction } from "@/app/admin/global/actions";
import { Button } from "@/components/ui/button";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";

export function SendAdminResetButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();

  function send() {
    if (!lock.tryAcquire()) return;
    startTransition(async () => {
      try {
        const result = await sendChurchAdminResetAction(email);
        if (result.ok) {
          toast.success(result.message ?? "E-mail de redefinição enviado.");
        } else {
          toast.error(result.message);
        }
      } finally {
        lock.release();
      }
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" loading={pending} onClick={send}>
      {pending ? "Enviando..." : "Redefinir senha"}
    </Button>
  );
}
