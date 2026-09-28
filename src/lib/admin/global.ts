import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type GlobalAdminRole = "viewer" | "operator" | "owner";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Garante que a requisição vem de um usuário autenticado e vinculado em
 * `global_admins`, com o papel mínimo exigido. Nunca autoriza no cliente:
 * a checagem final acontece via RPC `is_global_admin`, protegida no banco.
 */
export async function requireGlobalAdmin(
  minimumRole: GlobalAdminRole = "viewer",
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/admin/login");
    }

    const { data: isAuthorized } = await supabase.rpc("is_global_admin", {
      p_required_role: minimumRole,
    });

    if (!isAuthorized) {
      redirect("/admin/global/sem-permissao");
    }

    return { supabase, user };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    redirect("/admin/login");
  }
}
