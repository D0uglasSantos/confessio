import {
  ActivityIcon,
  ChurchIcon,
  LayoutDashboardIcon,
  type LucideIcon,
} from "lucide-react";

export type GlobalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const globalNavItems: GlobalNavItem[] = [
  {
    href: "/admin/global",
    label: "Visão geral",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    href: "/admin/global/paroquias",
    label: "Paróquias",
    icon: ChurchIcon,
  },
  {
    href: "/admin/global/atividade",
    label: "Atividade",
    icon: ActivityIcon,
  },
];

export function isGlobalNavActive(
  pathname: string,
  href: string,
  exact = false,
) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
