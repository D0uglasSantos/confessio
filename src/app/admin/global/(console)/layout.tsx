import { ConsoleShell } from "@/components/admin/global/console-shell";
import { requireGlobalAdmin } from "@/lib/admin/global";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Administração",
    template: "%s · Plataforma",
  },
};

export default async function GlobalConsoleLayout({
  children,
}: LayoutProps<"/admin/global">) {
  const { supabase, user } = await requireGlobalAdmin("viewer");
  const { data: parishMembership } = await supabase
    .from("church_admins")
    .select("church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ConsoleShell
      email={user.email ?? ""}
      hasParishAccess={Boolean(parishMembership)}
    >
      {children}
    </ConsoleShell>
  );
}
