import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let anonClient: SupabaseClient<Database> | null = null;

/**
 * Client para fiel / padre / TV.
 * Sem Auth (sessão anônima própria).
 */
export function createAnonClient() {
  if (anonClient) {
    return anonClient;
  }

  const { url, anonKey } = getSupabasePublicEnv();

  anonClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "fila-confissao-anon",
    },
  });

  return anonClient;
}
