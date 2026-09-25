"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createRealtimeRefetch } from "@/lib/queue/realtime-refetch";
import { createClient } from "@/lib/supabase/client";

export function AdminSessionRealtime({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const refetch = createRealtimeRefetch(200);

    const scheduleRefresh = () => {
      refetch.schedule(() => {
        router.refresh();
      });
    };

    const channel = supabase
      .channel(`admin-session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `session_id=eq.${sessionId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stations",
          filter: `session_id=eq.${sessionId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          refetch.run(() => {
            router.refresh();
          });
        }
      });

    return () => {
      refetch.dispose();
      void supabase.removeChannel(channel);
    };
  }, [router, sessionId]);

  return null;
}
