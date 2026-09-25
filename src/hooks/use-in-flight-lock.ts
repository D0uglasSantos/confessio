"use client";

import { useEffect, useRef } from "react";

/**
 * Trava síncrona contra double-tap antes do React re-renderizar `pending`.
 */
export function useInFlightLock() {
  const inFlight = useRef(false);

  function tryAcquire() {
    if (inFlight.current) return false;
    inFlight.current = true;
    return true;
  }

  function release() {
    inFlight.current = false;
  }

  useEffect(() => {
    return () => {
      inFlight.current = false;
    };
  }, []);

  return { tryAcquire, release, isLocked: () => inFlight.current };
}
