import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ConsolePageHeader } from "@/components/admin/console-page-header";
import { DuplicateSessionButton } from "@/components/admin/duplicate-session-button";
import { ParishOverviewMetrics } from "@/components/admin/parish/overview-metrics";
import { ParishShell } from "@/components/admin/parish/parish-shell";
import {
  getParishSessionStats,
  type ParishSessionSummary,
} from "@/components/admin/parish/session-helpers";
import { SessionStatusBadge } from "@/components/admin/parish/session-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdminChurch } from "@/lib/admin/church";
import {
  formatAdminDateTime,
  formatAdminTime,
  formatCounted,
} from "@/lib/admin/format";
import { isSameBrazilDay } from "@/lib/admin/datetime";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Secretaria",
};

export default async function AdminPage() {
  const { church, admin, supabase, user } = await requireAdminChurch();
  const [{ data: sessions }, { data: isGlobalAdmin }] = await Promise.all([
    admin
      .from("sessions")
      .select("id, name, slug, status, starts_at, created_at")
      .eq("church_id", church.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("is_global_admin", { p_required_role: "viewer" }),
  ]);

  const list = (sessions ?? []) as ParishSessionSummary[];
  const stats = getParishSessionStats(list);
  const recent = list.slice(0, 6);

  return (
    <ParishShell
      churchName={church.name}
      email={user.email ?? ""}
      isGlobalAdmin={Boolean(isGlobalAdmin)}
      churchActive={church.is_active}
    >
      <ConsolePageHeader
        title="Visão geral"
        description="Abra a fila, acompanhe as sessões e compartilhe o QR Code com os fiéis."
        actions={
          church.is_active ? (
            <Link href="/admin/sessoes/nova" className={buttonVariants()}>
              <PlusIcon data-icon="inline-start" />
              Nova sessão
            </Link>
          ) : undefined
        }
      />

      <NowHero
        live={stats.live}
        drafts={stats.drafts}
        canCreate={church.is_active}
      />

      <ParishOverviewMetrics sessions={list} />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-xl">Sessões recentes</h2>
          {list.length > 0 ? (
            <Link
              href="/admin/sessoes"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          ) : null}
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="Nenhuma sessão ainda"
            description="Crie a primeira sessão para abrir a fila de confissões."
            action={
              church.is_active ? (
                <Link href="/admin/sessoes/nova" className={buttonVariants()}>
                  Nova sessão
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {recent.map((session) => (
              <li key={session.id} className="group relative">
                <Link
                  href={`/admin/sessoes/${session.id}`}
                  className="hover:bg-primary/4 flex items-center justify-between gap-3 rounded-xl px-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{session.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {session.starts_at
                        ? formatAdminDateTime(session.starts_at)
                        : `/s/${session.slug}`}
                    </p>
                  </div>
                  <SessionStatusBadge status={session.status} />
                </Link>
                {church.is_active ? (
                  <div className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 group-hover:block group-focus-within:block">
                    <DuplicateSessionButton sessionId={session.id} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </ParishShell>
  );
}

function NowHero({
  live,
  drafts,
  canCreate,
}: {
  live: ParishSessionSummary[];
  drafts: ParishSessionSummary[];
  canCreate: boolean;
}) {
  const featuredLive = live[0];
  const todaysDrafts = drafts.filter(
    (session) => session.starts_at && isSameBrazilDay(session.starts_at),
  );
  const featuredDraft = todaysDrafts[0] ?? drafts[0];

  if (featuredLive) {
    return (
      <section className="border-border/70 flex flex-wrap items-center justify-between gap-4 border-y py-5">
        <div className="min-w-0">
          <p className="overline-label">Agora</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-heading truncate text-2xl">{featuredLive.name}</h2>
            <SessionStatusBadge status={featuredLive.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatCounted(live.length, {
              one: "fila em operação",
              other: "filas em operação",
            })}
            {featuredLive.starts_at
              ? ` · ${formatAdminDateTime(featuredLive.starts_at)}`
              : null}
          </p>
        </div>
        <Link
          href={`/admin/sessoes/${featuredLive.id}`}
          className={buttonVariants()}
        >
          Ir para a fila
        </Link>
      </section>
    );
  }

  if (featuredDraft?.starts_at) {
    return (
      <section className="border-border/70 flex flex-wrap items-center justify-between gap-4 border-y py-5">
        <div>
          <p className="overline-label">Agora</p>
          <h2 className="font-heading mt-2 text-2xl">
            Rascunho para hoje às {formatAdminTime(featuredDraft.starts_at)}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {featuredDraft.name}
          </p>
        </div>
        <Link
          href={`/admin/sessoes/${featuredDraft.id}`}
          className={buttonVariants()}
        >
          Abrir sessão
        </Link>
      </section>
    );
  }

  return (
    <section className="border-border/70 flex flex-wrap items-center justify-between gap-4 border-y py-5">
      <div>
        <p className="overline-label">Agora</p>
        <h2 className="font-heading mt-2 text-2xl">Nenhuma fila em andamento</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Quando a equipe estiver pronta, crie ou abra uma sessão.
        </p>
      </div>
      {canCreate ? (
        <Link href="/admin/sessoes/nova" className={buttonVariants()}>
          Criar nova sessão
        </Link>
      ) : null}
    </section>
  );
}
