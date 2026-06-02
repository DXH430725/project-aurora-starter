"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SIDEBAR_NAV } from "@/app/lib/destinations";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell navItems={SIDEBAR_NAV}>{children}</AppShell>;
}
