import { redirect } from "next/navigation";

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
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/admin/login");
    }

    const { data: membership, error } = await supabase
      .from("church_admins")
      .select("church_id, churches(id, name, slug)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !membership?.churches) {
      redirect("/admin/login?error=sem-permissao");
    }

    const church = Array.isArray(membership.churches)
      ? membership.churches[0]
      : membership.churches;

    if (!church) {
      redirect("/admin/login?error=sem-permissao");
    }

    return {
      supabase,
      user,
      church: church as { id: string; name: string; slug: string },
    };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    redirect("/admin/login");
  }
}
