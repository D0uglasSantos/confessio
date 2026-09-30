"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createSessionAction,
  type CreateSessionResult,
} from "@/app/admin/actions";
import { startNavigationProgress } from "@/components/navigation-progress";
import { generateSessionSlug } from "@/lib/admin/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateSessionResult | null = null;

type StationDraft = {
  name: string;
  priestName: string;
};

function defaultStations(): StationDraft[] {
  return [
    { name: "Confessionário 01", priestName: "" },
    { name: "Confessionário 02", priestName: "" },
    { name: "Confessionário 03", priestName: "" },
  ];
}

export function CreateSessionForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createSessionAction,
    initialState,
  );
  const [slug, setSlug] = useState(generateSessionSlug());
  const [stations, setStations] = useState<StationDraft[]>(defaultStations);

  const stationsJson = useMemo(() => JSON.stringify(stations), [stations]);

  useEffect(() => {
    if (!state?.ok) return;
    startNavigationProgress();
    router.push(`/admin/sessoes/${state.sessionId}`);
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="stationsJson" value={stationsJson} />

      {state && !state.ok ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nome da sessão</Label>
          <Input
            id="name"
            name="name"
            placeholder="Confissões Domingo 18h"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug / QR</Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toUpperCase())}
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setSlug(generateSessionSlug())}
            >
              Novo
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticketPrefix">Prefixo da senha</Label>
          <Input
            id="ticketPrefix"
            name="ticketPrefix"
            defaultValue="C"
            maxLength={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startsAt">Início</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endsAt">Término previsto</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Confessionários</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setStations((current) => [
                ...current,
                {
                  name: `Confessionário ${String(current.length + 1).padStart(2, "0")}`,
                  priestName: "",
                },
              ])
            }
          >
            Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {stations.map((station, index) => (
            <div
              key={`station-${index}`}
              className="grid gap-2 rounded-xl border border-border/80 bg-card p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                aria-label={`Nome do confessionário ${index + 1}`}
                value={station.name}
                onChange={(event) =>
                  setStations((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
                required
              />
              <Input
                aria-label={`Sacerdote do confessionário ${index + 1}`}
                placeholder="Nome do sacerdote"
                value={station.priestName}
                onChange={(event) =>
                  setStations((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, priestName: event.target.value }
                        : item,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                disabled={stations.length <= 1}
                onClick={() =>
                  setStations((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                Remover
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" loading={pending || !!state?.ok}>
        {state?.ok ? "Abrindo sessão..." : pending ? "Criando..." : "Criar sessão"}
      </Button>
    </form>
  );
}
