"use client";

import { SignOutButton } from "@/components/admin/sign-out-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0]?.trim() || "A";
  return local.slice(0, 1).toUpperCase();
}

export function UserMenu({
  email,
  collapsed = false,
}: {
  email: string;
  collapsed?: boolean;
}) {
  const label = email || "Conta";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "hover:bg-primary/5 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed && "justify-center px-0",
        )}
        aria-label="Menu da conta"
      >
        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
          {initialsFromEmail(label)}
        </span>
        {collapsed ? null : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{label}</span>
            <span className="text-muted-foreground block text-xs">Sair</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <p className="text-muted-foreground truncate px-2.5 py-2 text-xs" title={label}>
          {label}
        </p>
        <SignOutButton className="w-full justify-start" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
