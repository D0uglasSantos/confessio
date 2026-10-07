"use client";

import type { ReactNode } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function SessionDetailTabs({
  defaultTab,
  queue,
  stations,
  prep,
}: {
  defaultTab: "queue" | "stations" | "prep";
  queue: ReactNode;
  stations: ReactNode;
  prep?: ReactNode;
}) {
  return (
    <Tabs defaultValue={defaultTab} className="gap-5">
      <TabsList>
        {prep ? (
          <TabsTrigger value="prep">Preparação</TabsTrigger>
        ) : null}
        <TabsTrigger value="queue">Fila</TabsTrigger>
        <TabsTrigger value="stations">Confessionários</TabsTrigger>
      </TabsList>
      {prep ? <TabsContent value="prep">{prep}</TabsContent> : null}
      <TabsContent value="queue">{queue}</TabsContent>
      <TabsContent value="stations">{stations}</TabsContent>
    </Tabs>
  );
}
