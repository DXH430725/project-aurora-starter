"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SIDEBAR_NAV } from "@/app/lib/destinations";
import { useSidebarSummary } from "@/app/hooks/use-sidebar-summary";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const summary = useSidebarSummary();
  const navItems = SIDEBAR_NAV.map((item) => {
    if (item.label === "Monitor" || item.label === "Status") {
      return { ...item, badge: summary?.status.badge ?? "..." };
    }
    if (item.label === "AMP") return { ...item, badge: summary?.amp.badge ?? "..." };
    return item;
  });

  return <AppShell navItems={navItems}>{children}</AppShell>;
}
