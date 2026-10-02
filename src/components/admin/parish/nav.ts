import { LayoutDashboardIcon, ListChecksIcon, type LucideIcon } from "lucide-react";

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
    return pathname === href || pathname.startsWith("/admin/sessoes/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
