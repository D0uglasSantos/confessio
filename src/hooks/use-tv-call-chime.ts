"use client";

import { useEffect, useRef, useState } from "react";

import {
  callingSignal,
  playCallChime,
  unlockCallChime,
} from "@/lib/tv/call-chime";
import type { PublicStationState } from "@/lib/queue/types";

export function useTvCallChime(stations: PublicStationState[]) {
  const [soundReady, setSoundReady] = useState(false);
  const lastSignalRef = useRef<string | null>(null);
  const primedRef = useRef(false);
  const signal = callingSignal(stations);

  useEffect(() => {
    if (!primedRef.current) {
      primedRef.current = true;
      lastSignalRef.current = signal;
      return;
    }

    if (!soundReady) {
      lastSignalRef.current = signal;
      return;
    }

    if (!signal || signal === lastSignalRef.current) {
      lastSignalRef.current = signal;
      return;
    }

    lastSignalRef.current = signal;
    void playCallChime();
  }, [signal, soundReady]);

  async function enableSound() {
    const unlocked = await unlockCallChime();
    if (!unlocked) return;

    lastSignalRef.current = signal;
    setSoundReady(true);
    void playCallChime();
  }

  return { soundReady, enableSound };
}
