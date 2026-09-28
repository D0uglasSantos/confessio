import {
  CalendarPlusIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  type LucideIcon,
} from "lucide-react";

export type ParishNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const parishNavItems: ParishNavItem[] = [
  {
    href: "/admin",
    label: "Visão geral",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    href: "/admin/sessoes",
    label: "Sessões",
    icon: ListChecksIcon,
  },
  {
    href: "/admin/sessoes/nova",
    label: "Nova sessão",
    icon: CalendarPlusIcon,
    exact: true,
  },
];

export function isParishNavActive(
  pathname: string,
  href: string,
  exact = false,
) {
  if (exact) {
    return pathname === href;
  }

  if (href === "/admin/sessoes") {
    return (
      pathname === href ||
      (pathname.startsWith("/admin/sessoes/") &&
        pathname !== "/admin/sessoes/nova" &&
        !pathname.includes("/imprimir"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
