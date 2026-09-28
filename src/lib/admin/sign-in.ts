import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

import type { AdminSignInFailure } from "@/lib/admin/sign-in-messages";

export type { AdminSignInFailure };

export type AdminDestination = "/admin" | "/admin/global";

export type AdminSignInResult =
  | { ok: true; destination: AdminDestination }
  | { ok: false; code: AdminSignInFailure };

export async function signInAdminWithPassword(
  supabase: SupabaseClient<Database>,
  email: string,
  password: string,
): Promise<AdminSignInResult> {
  if (!email || !password) {
    return { ok: false, code: "missing" };
  }

  let data: { user: { id: string } | null } | null = null;

  try {
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      if (result.error.code === "email_not_confirmed") {
        return { ok: false, code: "unconfirmed" };
      }

      return { ok: false, code: "credentials" };
    }

    data = result.data;
  } catch {
    return { ok: false, code: "unexpected" };
  }

  if (!data?.user) {
    return { ok: false, code: "unexpected" };
  }

  try {
    const admin = tryCreateAdminClient();
    if (!admin) {
      return { ok: true, destination: "/admin" };
    }

    const [{ data: membership }, { data: globalAdmin }] = await Promise.all([
      admin
        .from("church_admins")
        .select("church_id")
        .eq("user_id", data.user.id)
        .maybeSingle(),
      admin
        .from("global_admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    if (!membership && !globalAdmin) {
      await supabase.auth.signOut();
      return { ok: false, code: "forbidden" };
    }

    if (globalAdmin && !membership) {
      return { ok: true, destination: "/admin/global" };
    }

    return { ok: true, destination: "/admin" };
  } catch {
    return { ok: true, destination: "/admin" };
  }
}
