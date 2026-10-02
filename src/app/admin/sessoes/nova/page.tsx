import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { CreateSessionForm } from "@/components/admin/create-session-form";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminChurch } from "@/lib/admin/church";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nova sessão",
};

export default async function AdminNewSessionPage() {
  const { church, supabase, user } = await requireAdminChurch();
  const [{ data: isGlobalAdmin }, { data: lastSession }] = await Promise.all([
    supabase.rpc("is_global_admin", { p_required_role: "viewer" }),
    supabase
      .from("sessions")
      .select("id")
      .eq("church_id", church.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: lastStationRows } = lastSession
    ? await supabase
        .from("stations")
        .select("name, priest_name")
        .eq("session_id", lastSession.id)
        .order("name")
    : { data: [] };

  const lastStations = (lastStationRows ?? []).map((station) => ({
    name: station.name,
    priestName: station.priest_name ?? "",
  }));

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <ConsolePageHeader
        title="Nova sessão"
        description="A sessão nasce como rascunho. Depois você abre a fila quando a equipe estiver pronta."
      />
      <Card>
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
          <CardDescription>
            Defina o horário, o prefixo das senhas e os confessionários desta
            sessão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSessionForm lastStations={lastStations} />
        </CardContent>
      </Card>
    </ParishShell>
  );
}
