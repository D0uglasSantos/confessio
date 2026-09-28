"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setChurchActiveAction } from "@/app/admin/global/actions";
import { Button } from "@/components/ui/button";

export function SetChurchActiveButton({
  churchId,
  churchName,
  isActive,
  hasActiveSession,
}: {
  churchId: string;
  churchName: string;
  isActive: boolean;
  hasActiveSession: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      isActive &&
      !window.confirm(
        `Desativar ${churchName}? A secretaria deixa de operar novas sessões. Histórico operacional é preservado.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await setChurchActiveAction(churchId, !isActive);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      disabled={pending || (isActive && hasActiveSession)}
      title={
        isActive && hasActiveSession
          ? "Encerre as sessões ativas antes de desativar."
          : undefined
      }
      onClick={handleClick}
    >
      {pending
        ? isActive
          ? "Desativando..."
          : "Reativando..."
        : isActive
          ? "Desativar"
          : "Reativar"}
    </Button>
  );
}
