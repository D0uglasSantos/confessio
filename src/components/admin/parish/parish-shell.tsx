"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { SignOutButton } from "@/components/admin/sign-out-button";
import {
  isParishNavActive,
  parishNavItems,
} from "@/components/admin/parish/nav";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export function ParishShell({
  churchName,
  email,
  isGlobalAdmin,
  churchActive = true,
  children,
}: {
  churchName: string;
  email: string;
  isGlobalAdmin: boolean;
  churchActive?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="platform-console flex min-h-dvh flex-1">
      <aside className="platform-nav hidden w-60 shrink-0 flex-col lg:flex">
        <SidebarContent
          pathname={pathname}
          churchName={churchName}
          email={email}
          isGlobalAdmin={isGlobalAdmin}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="platform-nav relative flex h-full w-64 flex-col shadow-xl">
            <div className="flex justify-end p-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-primary-foreground hover:text-primary-foreground hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                <XIcon />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
            <SidebarContent
              pathname={pathname}
              churchName={churchName}
              email={email}
              isGlobalAdmin={isGlobalAdmin}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <div className="min-w-0">
            <p
              className="line-clamp-2 text-sm font-medium leading-tight"
              title={churchName}
            >
              {churchName}
            </p>
            <p className="text-muted-foreground text-xs">Secretaria</p>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {churchActive ? null : (
              <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                Esta paróquia está desativada. O histórico permanece visível, mas
                não é possível abrir novas sessões.
              </p>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  churchName,
  email,
  isGlobalAdmin,
  onNavigate,
}: {
  pathname: string;
  churchName: string;
  email: string;
  isGlobalAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-5">
        <BrandMark compact onDark />
        <div className="min-w-0">
          <p
            className="font-heading line-clamp-2 text-sm leading-tight"
            title={churchName}
          >
            {churchName}
          </p>
          <p className="platform-nav-muted mt-0.5 text-[11px] tracking-[0.16em] uppercase">
            Secretaria
          </p>
        </div>
      </div>

      <nav
        aria-label="Administração da paróquia"
        className="flex flex-1 flex-col gap-1 px-2"
      >
        {parishNavItems.map((item) => {
          const Icon = item.icon;
          const active = isParishNavActive(pathname, item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              aria-current={active ? "page" : undefined}
              className="platform-nav-link flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium"
              onClick={onNavigate}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-[var(--platform-nav-border)] px-3 py-4">
        <p className="platform-nav-muted truncate px-1 text-xs" title={email}>
          {email || "Secretaria"}
        </p>
        {isGlobalAdmin ? (
          <Link
            href="/admin/global"
            className="platform-nav-link block rounded-md px-3 py-2 text-sm"
            onClick={onNavigate}
          >
            Painel da plataforma
          </Link>
        ) : null}
        <SignOutButton className="w-full justify-start text-[var(--platform-nav-muted)] hover:bg-white/10 hover:text-[var(--platform-nav-foreground)]" />
      </div>
    </>
  );
}
