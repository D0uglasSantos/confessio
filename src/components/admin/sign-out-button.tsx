"use client";

import { signOutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => signOutAdmin()}
    >
      Sair
    </Button>
  );
}
