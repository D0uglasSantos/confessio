"use client";

import { useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";

import { AssignChurchAdminDialog } from "@/components/admin/global/assign-church-admin-dialog";
import { EditChurchDialog } from "@/components/admin/global/edit-church-dialog";
import { SetChurchActiveButton } from "@/components/admin/global/set-church-active-button";
import { Button } from "@/components/ui/button";
import type { GlobalChurchSummary } from "@/lib/admin/global-metrics";

export function ChurchRowActions({ church }: { church: GlobalChurchSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-1.5">
      <EditChurchDialog
        churchId={church.id}
        name={church.name}
        slug={church.slug}
        logoUrl={church.logo_url}
      />
      <AssignChurchAdminDialog
        churchId={church.id}
        churchName={church.name}
      />
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Mais ações para ${church.name}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontalIcon />
        </Button>
        {open ? (
          <div className="bg-popover text-popover-foreground absolute right-0 z-20 mt-1 w-44 rounded-xl border p-1 shadow-md">
            <SetChurchActiveButton
              churchId={church.id}
              churchName={church.name}
              isActive={church.is_active}
              hasActiveSession={church.sessions_open_now > 0}
              inMenu
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
