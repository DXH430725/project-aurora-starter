"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

function toTitle(seg: string) {
  if (seg.startsWith("_")) return seg.slice(1).replace(/^./, (c) => c.toUpperCase());
  return seg.replace(/^./, (c) => c.toUpperCase());
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        Home
      </Link>
      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const last = idx === segments.length - 1;
        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {last ? (
              <span className="text-foreground">{toTitle(seg)}</span>
            ) : (
              <Link href={href} className="text-muted-foreground hover:text-foreground">
                {toTitle(seg)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Multi-zone
        </span>
      </div>
    </header>
  );
}
