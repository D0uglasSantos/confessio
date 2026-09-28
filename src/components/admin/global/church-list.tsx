import { AssignChurchAdminDialog } from "@/components/admin/global/assign-church-admin-dialog";
import { EditChurchDialog } from "@/components/admin/global/edit-church-dialog";
import { SetChurchActiveButton } from "@/components/admin/global/set-church-active-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { GlobalChurchSummary } from "@/lib/admin/global-metrics";

export function ChurchList({ churches }: { churches: GlobalChurchSummary[] }) {
  if (churches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Nenhuma paróquia cadastrada ainda. Use o formulário abaixo para
          cadastrar a primeira.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Paróquia</th>
              <th className="px-4 py-3 font-medium">Uso</th>
              <th className="px-4 py-3 font-medium">Admins locais</th>
              <th className="px-4 py-3 font-medium">Cadastrada em</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {churches.map((church) => (
              <tr key={church.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{church.name}</span>
                    {church.is_active ? null : (
                      <Badge variant="outline">Desativada</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    /{church.slug}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {church.sessions_open_now > 0 ? (
                    <Badge>Fila ativa</Badge>
                  ) : church.sessions_total > 0 ? (
                    <Badge variant="outline">Já usou</Badge>
                  ) : (
                    <Badge variant="secondary">Sem uso ainda</Badge>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {church.sessions_total} sessão(ões) no total
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {church.admins_count}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {church.created_at
                    ? formatAdminDateTime(church.created_at)
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <EditChurchDialog
                      churchId={church.id}
                      name={church.name}
                      slug={church.slug}
                      logoUrl={church.logo_url}
                    />
                    <AssignChurchAdminDialog
                      churchId={church.id}
                      churchName={church.name}
                    />
                    <SetChurchActiveButton
                      churchId={church.id}
                      churchName={church.name}
                      isActive={church.is_active}
                      hasActiveSession={church.sessions_open_now > 0}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
