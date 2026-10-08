"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, PanelLeftIcon, XIcon } from "lucide-react";

import { UserMenu } from "@/components/admin/user-menu";
import {
  globalNavItems,
  isGlobalNavActive,
} from "@/components/admin/global/nav";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";
import { cn } from "cn";

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="platform-console flex h-dvh overflow-hidden">
      <aside
        className={cn(
          "platform-nav hidden h-full shrink-0 flex-col transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-[4.5rem]" : "w-60",
        )}
      >
        <SidebarContent
          pathname={pathname}
          email={email}
          hasParishAccess={hasParishAccess}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="platform-nav relative flex h-full w-64 flex-col shadow-md">
            <div className="flex justify-end p-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="bg-background/90 flex shrink-0 items-center gap-3 border-b px-4 py-3 backdrop-blur lg:hidden">
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
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 2xl:max-w-[100rem]">
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
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: {
  pathname: string;
  email: string;
  hasParishAccess: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-5",
          collapsed && "flex-col px-2",
        )}
      >
        <BrandMark compact />
        {collapsed ? null : (
          <div className="min-w-0">
            <p className="font-heading truncate text-sm leading-tight">
              {APP_NAME}
            </p>
            <p className="platform-nav-muted mt-0.5 text-[11px] tracking-[0.08em] uppercase">
              Plataforma
            </p>
          </div>
        )}
      </div>

      <nav
        aria-label="Administração da plataforma"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2"
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
              title={collapsed ? item.label : undefined}
              className={cn(
                "platform-nav-link flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium",
                collapsed && "justify-center px-0",
              )}
              onClick={onNavigate}
            >
              <Icon className="size-4 shrink-0" />
              {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-2 border-t border-[var(--platform-nav-border)] px-2 py-3">
        {hasParishAccess ? (
          <Link
            href="/admin"
            className={cn(
              "platform-nav-link block rounded-xl px-3 py-2 text-sm",
              collapsed && "px-0 text-center",
            )}
            title={collapsed ? "Painel da paróquia" : undefined}
            onClick={onNavigate}
          >
            {collapsed ? "Paróquia" : "Painel da paróquia"}
          </Link>
        ) : null}
        {onToggleCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <PanelLeftIcon />
            {collapsed ? null : "Recolher"}
          </Button>
        ) : null}
        <UserMenu email={email} collapsed={collapsed} />
      </div>
    </>
  );
}
