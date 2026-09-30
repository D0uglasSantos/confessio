"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateChurchAction } from "@/app/admin/global/actions";
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

export function EditChurchDialog({
  churchId,
  name,
  slug,
  logoUrl,
}: {
  churchId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [churchName, setChurchName] = useState(name);
  const [churchSlug, setChurchSlug] = useState(slug);
  const [churchLogo, setChurchLogo] = useState(logoUrl ?? "");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setChurchName(name);
      setChurchSlug(slug);
      setChurchLogo(logoUrl ?? "");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set("churchId", churchId);
    formData.set("name", churchName);
    formData.set("slug", churchSlug);
    formData.set("logoUrl", churchLogo);

    startTransition(async () => {
      const result = await updateChurchAction(null, formData);

      if (result.ok) {
        toast.success(result.message ?? "Paróquia atualizada.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar paróquia</DialogTitle>
          <DialogDescription>
            Nome e slug identificam a paróquia no painel e nas rotas públicas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-name-${churchId}`}>Nome</Label>
            <Input
              id={`edit-name-${churchId}`}
              value={churchName}
              onChange={(event) => setChurchName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-slug-${churchId}`}>Slug</Label>
            <Input
              id={`edit-slug-${churchId}`}
              value={churchSlug}
              onChange={(event) => setChurchSlug(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-logo-${churchId}`}>Logo (URL)</Label>
            <Input
              id={`edit-logo-${churchId}`}
              type="url"
              value={churchLogo}
              onChange={(event) => setChurchLogo(event.target.value)}
              placeholder="https://..."
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
            <Button type="submit" loading={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
