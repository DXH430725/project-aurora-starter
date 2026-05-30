"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { SIDEBAR_NAV } from "@/lib/destinations";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-normal",
        collapsed ? "w-16" : "w-60",
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            <Image src="/dxh.png" alt="dxh" fill sizes="28px" className="object-cover" />
          </div>
          {!collapsed && <span className="truncate text-sm font-medium">dxh</span>}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const item = (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-fast",
                "hover:bg-muted",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                collapsed && "justify-center",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
          if (!collapsed) return item;
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{item}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className={cn(
          "flex h-10 items-center border-t border-border px-3 text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground",
          collapsed ? "justify-center" : "justify-end gap-2",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <>
            <span className="text-xs">Collapse</span>
            <ChevronsLeft className="h-4 w-4" />
          </>
        )}
      </button>
    </aside>
  );
}
