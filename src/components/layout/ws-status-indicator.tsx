"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useWSStore } from "@/stores/ws-store";
import { useWSClient } from "@/components/providers/ws-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function WSStatusIndicator() {
  const state = useWSStore((s) => s.state);
  const lastError = useWSStore((s) => s.lastError);
  const metrics = useWSStore((s) => s.metrics);
  const client = useWSClient();

  const { dotClass, label } = React.useMemo(() => {
    switch (state) {
      case "OPEN":
        return { dotClass: "bg-positive animate-breathe", label: "Live" };
      case "CONNECTING":
      case "RECONNECTING":
        return {
          dotClass: "bg-warning animate-breathe",
          label:
            metrics.reconnectCount > 0
              ? `Connecting… (retry ${metrics.reconnectCount})`
              : "Connecting…",
        };
      case "CLOSING":
        return { dotClass: "bg-muted-foreground", label: "Closing…" };
      case "CLOSED":
      default:
        return { dotClass: "bg-negative", label: "Disconnected" };
    }
  }, [state, metrics.reconnectCount]);

  const handleReconnect = () => {
    client.disconnect();
    client.connect();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5",
            "text-xs font-medium",
          )}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} aria-hidden />
          <span className="text-foreground">{label}</span>
          {state === "CLOSED" && (
            <button
              onClick={handleReconnect}
              aria-label="Reconnect"
              className="ml-1 inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="flex flex-col gap-1">
          <div>WebSocket · {state}</div>
          {metrics.latency != null && <div>RTT: {metrics.latency}ms</div>}
          {lastError && <div className="text-negative">Error: {lastError}</div>}
          <div>↓ {metrics.messagesReceived} · ↑ {metrics.messagesSent}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
