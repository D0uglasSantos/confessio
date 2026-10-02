"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { duplicateSessionAction } from "@/app/admin/actions";
import { startNavigationProgress } from "@/components/navigation-progress";
import { Button } from "@/components/ui/button";
import { useInFlightLock } from "@/hooks/use-in-flight-lock";

export function DuplicateSessionButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lock = useInFlightLock();

  function duplicate() {
    if (!lock.tryAcquire()) return;
    startTransition(async () => {
      try {
        const result = await duplicateSessionAction(sessionId);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Sessão duplicada como rascunho.");
        startNavigationProgress();
        router.push(`/admin/sessoes/${result.sessionId}`);
      } finally {
        lock.release();
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        duplicate();
      }}
    >
      {pending ? "Duplicando..." : "Duplicar"}
    </Button>
  );
}
