"use client";

import * as React from "react";

export interface SidebarSummaryResponse {
  status: { state: "ok" | "unreachable"; badge: string };
  amp: { state: "ok" | "unreachable"; badge: string };
}

export function useSidebarSummary() {
  const [summary, setSummary] = React.useState<SidebarSummaryResponse | null>(null);

  React.useEffect(() => {
    let disposed = false;

    async function load() {
      try {
        const response = await fetch("/api/sidebar-summary", { cache: "no-store" });
        const payload = (await response.json()) as SidebarSummaryResponse;
        if (!disposed) setSummary(payload);
      } catch {
        if (!disposed) {
          setSummary({
            status: { state: "unreachable", badge: "offline" },
            amp: { state: "unreachable", badge: "offline" },
          });
        }
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  return summary;
}
