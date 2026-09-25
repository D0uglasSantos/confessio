import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

export function createAdminClient() {
  const { url } = getSupabasePublicEnv();

  return createClient<Database>(url, getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
