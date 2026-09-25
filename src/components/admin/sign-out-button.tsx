"use client";

import { signOutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button type="button" variant="ghost" onClick={() => signOutAdmin()}>
      Sair
    </Button>
  );
}
