import { redirect } from "next/navigation";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function requireAdminChurch() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/admin/login");
    }

    const admin = tryCreateAdminClient() ?? supabase;
    const { data: membership } = await admin
      .from("church_admins")
      .select("church_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      const { data: isGlobal } = await supabase.rpc("is_global_admin", {
        p_required_role: "viewer",
      });

      if (isGlobal) {
        redirect("/admin/global");
      }

      redirect("/admin/sem-permissao");
    }

    const { data: church } = await admin
      .from("churches")
      .select("id, name, slug, is_active")
      .eq("id", membership.church_id)
      .maybeSingle();

    if (!church) {
      redirect("/admin/sem-permissao");
    }

    return {
      supabase,
      admin,
      user,
      church,
    };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    redirect("/admin/login");
  }
}

export const CHURCH_INACTIVE_MESSAGE =
  "Esta paróquia está desativada. Não é possível abrir novas sessões.";
