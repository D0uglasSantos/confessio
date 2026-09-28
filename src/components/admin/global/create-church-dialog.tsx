"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { CreateChurchForm } from "@/components/admin/global/create-church-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateChurchDialog({
  variant = "default",
}: {
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} />}>
        <PlusIcon data-icon="inline-start" />
        Nova paróquia
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova paróquia</DialogTitle>
          <DialogDescription>
            Depois de cadastrar, vincule o admin local pelo ID de usuário já
            criado no Supabase Auth.
          </DialogDescription>
        </DialogHeader>
        {open ? <CreateChurchForm onSuccess={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
