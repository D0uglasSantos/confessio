"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { assignChurchAdminAction } from "@/app/admin/global/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AssignChurchAdminDialog({
  churchId,
  churchName,
}: {
  churchId: string;
  churchName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set("churchId", churchId);
    formData.set("userId", userId);

    startTransition(async () => {
      const result = await assignChurchAdminAction(null, formData);

      if (result.ok) {
        toast.success(result.message ?? "Admin vinculado.");
        setUserId("");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Vincular admin
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular admin — {churchName}</DialogTitle>
          <DialogDescription>
            Informe o ID de usuário (auth.users.id) já criado no Supabase Auth.
            Esse usuário passa a administrar esta paróquia em{" "}
            <code>/admin</code>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`user-id-${churchId}`}>ID do usuário</Label>
            <Input
              id={`user-id-${churchId}`}
              name="userId"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
