"use client";

/**
 * Stub legado — o realtime da fila usa postgres_changes +
 * createRealtimeRefetch nos hooks usePublicSession / useStationState /
 * useFaithfulTicket / AdminSessionRealtime.
 */
export function useRealtimeSession(sessionId?: string) {
  void sessionId;
  return {
    connected: false,
  };
}
