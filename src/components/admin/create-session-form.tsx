"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createSessionAction,
  type CreateSessionResult,
} from "@/app/admin/actions";
import { startNavigationProgress } from "@/components/navigation-progress";
import { generateSessionSlug } from "@/lib/admin/labels";
import {
  addHoursToBrazilLocalInput,
  nextFullHourBrazilLocalInput,
} from "@/lib/admin/datetime";
import { formatPublicCode } from "@/lib/queue/ticket";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateSessionResult | null = null;

export type StationDraft = {
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

function prefixPreview(prefix: string) {
  const value = prefix.trim().toUpperCase() || "C";
  return [1, 2, 3].map((number) => formatPublicCode(value, number)).join(", ");
}

export function CreateSessionForm({
  lastStations = [],
}: {
  lastStations?: StationDraft[];
}) {
  const router = useRouter();
  const startsDefault = nextFullHourBrazilLocalInput();
  const [state, formAction, pending] = useActionState(
    createSessionAction,
    initialState,
  );
  const [slug, setSlug] = useState(generateSessionSlug());
  const [prefix, setPrefix] = useState("C");
  const [startsAt, setStartsAt] = useState(startsDefault);
  const [endsAt, setEndsAt] = useState(addHoursToBrazilLocalInput(startsDefault, 2));
  const [stations, setStations] = useState<StationDraft[]>(defaultStations);
  const [prefixError, setPrefixError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const stationsJson = useMemo(() => JSON.stringify(stations), [stations]);

  useEffect(() => {
    if (!state?.ok) return;
    toast.success("Sessão criada.");
    startNavigationProgress();
    router.push(`/admin/sessoes/${state.sessionId}`);
  }, [router, state]);

  function validatePrefix(value: string) {
    if (!value.trim()) {
      setPrefixError("Informe o prefixo da senha");
      return false;
    }
    if (value.length > 4) {
      setPrefixError("Use no máximo 4 caracteres");
      return false;
    }
    if (!/^[A-Za-z0-9]+$/.test(value)) {
      setPrefixError("Use apenas letras e números");
      return false;
    }
    setPrefixError(null);
    return true;
  }

  function validateRange(nextStart: string, nextEnd: string) {
    if (nextEnd && nextStart && nextEnd <= nextStart) {
      setRangeError("O término precisa ser posterior ao início.");
      return false;
    }
    setRangeError(null);
    return true;
  }

  function removeStation(index: number) {
    const station = stations[index];
    if (station?.priestName.trim()) {
      setRemoveIndex(index);
      return;
    }
    setStations((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const stationToRemove =
    removeIndex === null ? null : stations[removeIndex] ?? null;

  return (
    <>
    <form
      action={formAction}
      className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]"
      onSubmit={(event) => {
        const prefixOk = validatePrefix(prefix);
        const rangeOk = validateRange(startsAt, endsAt);
        if (!prefixOk || !rangeOk || stations.length === 0) {
          event.preventDefault();
          if (stations.length === 0) {
            toast.error("Cadastre pelo menos um confessionário.");
          }
        }
      }}
    >
      <input type="hidden" name="stationsJson" value={stationsJson} />

      <div className="space-y-8">
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
          <Label htmlFor="startsAt">Início</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => {
              const value = event.target.value;
              setStartsAt(value);
              const nextEnd = addHoursToBrazilLocalInput(value || startsAt, 2);
              setEndsAt(nextEnd);
              validateRange(value, nextEnd);
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endsAt">Término previsto</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            value={endsAt}
            aria-invalid={rangeError ? true : undefined}
            onChange={(event) => {
              const value = event.target.value;
              setEndsAt(value);
              validateRange(startsAt, value);
            }}
            required
          />
          <p className="text-destructive min-h-4 text-xs">{rangeError}</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ticketPrefix">Prefixo da senha</Label>
          <Input
            id="ticketPrefix"
            name="ticketPrefix"
            value={prefix}
            maxLength={4}
            aria-invalid={prefixError ? true : undefined}
            onChange={(event) => {
              const value = event.target.value.toUpperCase();
              setPrefix(value);
              validatePrefix(value);
            }}
            required
          />
          <p className="text-muted-foreground min-h-4 text-xs">
            As senhas serão {prefixPreview(prefix)}…
          </p>
          {prefixError ? (
            <p className="text-destructive text-xs">{prefixError}</p>
          ) : null}
        </div>
      </div>

      <details className="border-border/70 border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium">
          Opções avançadas
        </summary>
        <div className="mt-3 space-y-2">
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
          <p className="text-muted-foreground text-xs">
            Gerado automaticamente. Só altere se precisar de um código
            específico no cartaz.
          </p>
        </div>
      </details>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg">Confessionários</h2>
          <div className="flex flex-wrap gap-2">
            {lastStations.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStations(lastStations)}
              >
                Copiar da última sessão
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
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
        </div>

        {stations.length === 0 ? (
          <p className="text-destructive text-sm">
            Cadastre pelo menos um confessionário para salvar.
          </p>
        ) : null}

        <div className="divide-y divide-border/70">
          {stations.map((station, index) => (
            <div
              key={`station-${index}`}
              className="grid gap-2 py-3 sm:grid-cols-[1fr_1fr_auto]"
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
                onClick={() => removeStation(index)}
              >
                Remover
              </Button>
            </div>
          ))}
        </div>
      </div>
      </div>

      <aside className="border-border/70 xl:sticky xl:top-6 space-y-4 border-t pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
        <p className="overline-label">Resumo</p>
        <p className="font-heading text-lg leading-snug">
          As senhas serão {prefixPreview(prefix)}…
        </p>
        <p className="text-muted-foreground text-sm">
          {stations.length} confessionário{stations.length === 1 ? "" : "s"}
        </p>
        <Button type="submit" size="lg" className="w-full" loading={pending || !!state?.ok}>
          {state?.ok ? "Abrindo sessão..." : pending ? "Criando..." : "Criar sessão"}
        </Button>
      </aside>
    </form>

      <ConfirmDialog
        open={stationToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveIndex(null);
        }}
        title={`Remover ${stationToRemove?.name ?? "confessionário"}?`}
        description="O nome do sacerdote já está preenchido."
        confirmLabel="Remover"
        onConfirm={() => {
          if (removeIndex === null) return;
          setStations((current) =>
            current.filter((_, itemIndex) => itemIndex !== removeIndex),
          );
          setRemoveIndex(null);
        }}
      />
    </>
  );
}
