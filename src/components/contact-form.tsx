"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm({ to }: { to: string }) {
  const [parish, setParish] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Confessio — interesse de ${parish}`);
    const body = encodeURIComponent(
      `Paróquia: ${parish}\nCidade: ${city}\nE-mail: ${email}\n\nGostaríamos de levar o Confessio para nossa comunidade.`,
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parish">Nome da paróquia</Label>
        <Input
          id="parish"
          name="parish"
          value={parish}
          onChange={(event) => setParish(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Cidade</Label>
        <Input
          id="city"
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <Button type="submit" size="lg">
        Enviar mensagem
      </Button>
      <p className="text-muted-foreground text-xs">
        O pedido abre o seu aplicativo de e-mail. Nada é gravado neste site.
      </p>
    </form>
  );
}
