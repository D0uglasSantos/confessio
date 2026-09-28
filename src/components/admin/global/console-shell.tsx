"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { SignOutButton } from "@/components/admin/sign-out-button";
import {
  globalNavItems,
  isGlobalNavActive,
} from "@/components/admin/global/nav";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

export function ConsoleShell({
  email,
  hasParishAccess,
  children,
}: {
  email: string;
  hasParishAccess: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="platform-console flex min-h-dvh flex-1">
      <aside className="platform-nav hidden w-60 shrink-0 flex-col lg:flex">
        <SidebarContent
          pathname={pathname}
          email={email}
          hasParishAccess={hasParishAccess}
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
              email={email}
              hasParishAccess={hasParishAccess}
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
            <p className="truncate text-sm font-medium">{APP_NAME}</p>
            <p className="text-muted-foreground text-xs">Plataforma</p>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  email,
  hasParishAccess,
  onNavigate,
}: {
  pathname: string;
  email: string;
  hasParishAccess: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-5">
        <BrandMark compact onDark />
        <div className="min-w-0">
          <p className="font-heading truncate text-sm leading-tight">
            {APP_NAME}
          </p>
          <p className="platform-nav-muted mt-0.5 text-[11px] tracking-[0.16em] uppercase">
            Plataforma
          </p>
        </div>
      </div>

      <nav
        aria-label="Administração da plataforma"
        className="flex flex-1 flex-col gap-1 px-2"
      >
        {globalNavItems.map((item) => {
          const Icon = item.icon;
          const active = isGlobalNavActive(pathname, item.href, item.exact);

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
          {email || "Administrador"}
        </p>
        {hasParishAccess ? (
          <Link
            href="/admin"
            className="platform-nav-link block rounded-md px-3 py-2 text-sm"
            onClick={onNavigate}
          >
            Painel da paróquia
          </Link>
        ) : null}
        <SignOutButton className="w-full justify-start text-[var(--platform-nav-muted)] hover:bg-white/10 hover:text-[var(--platform-nav-foreground)]" />
      </div>
    </>
  );
}
