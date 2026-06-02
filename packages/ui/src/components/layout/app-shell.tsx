"use client";

import * as React from "react";
import { Sidebar, type SidebarNavItem } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export function AppShell({
  children,
  navItems,
}: {
  children: React.ReactNode;
  navItems: SidebarNavItem[];
}) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar navItems={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-screen-2xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
