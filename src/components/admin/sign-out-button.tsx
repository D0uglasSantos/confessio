"use client";

import { useTransition } from "react";

import { signOutAdmin } from "@/app/admin/actions";
import { startNavigationProgress } from "@/components/navigation-progress";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      loading={pending}
      onClick={() => {
        startNavigationProgress();
        startTransition(() => {
          void signOutAdmin();
        });
      }}
    >
      {pending ? "Saindo..." : "Sair"}
    </Button>
  );
}
