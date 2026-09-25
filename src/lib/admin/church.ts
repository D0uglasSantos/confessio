import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireAdminChurch() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
}
