"use client";

import * as React from "react";
import { ChevronRight, CheckCircle2, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GlowingEffect } from "@/components/effects/glowing-effect";
import { useChannel } from "@/hooks/use-channel";
import { cn } from "@/lib/utils";

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  triggeredAt: number;
  acknowledged?: boolean;
}

interface WSAlertData {
  id: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  triggeredAt: string;
}

const MAX_ALERTS = 40;

const SEV_STYLE: Record<AlertSeverity, { badge: string; label: string }> = {
  critical: { badge: "bg-negative-muted text-negative", label: "Critical" },
  warning: { badge: "bg-warning-muted text-warning", label: "Warning" },
  info: { badge: "bg-info-muted text-info", label: "Info" },
};

export function AlertList({ className }: { className?: string }) {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  useChannel<WSAlertData>("alerts.*", (msg) => {
    if (msg.type !== "data" || !msg.data) return;
    const d = msg.data;
    const alert: Alert = {
      id: d.id,
      severity: d.severity,
      title: d.title,
      description: d.description,
      triggeredAt: new Date(d.triggeredAt).getTime(),
    };
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) return prev;
      return [alert, ...prev].slice(0, MAX_ALERTS);
    });
  });

  const acknowledge = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  const dismiss = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {alerts.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No active alerts.
        </div>
      )}
      {alerts.map((a) => (
        <AlertRow key={a.id} alert={a} onAck={() => acknowledge(a.id)} onDismiss={() => dismiss(a.id)} />
      ))}
    </div>
  );
}

function AlertRow({
  alert,
  onAck,
  onDismiss,
}: {
  alert: Alert;
  onAck: () => void;
  onDismiss: () => void;
}) {
  const [open, setOpen] = React.useState(alert.severity === "critical");
  const glowing = alert.severity === "critical" && !alert.acknowledged;
  const style = SEV_STYLE[alert.severity];

  return (
    <GlowingEffect active={glowing} tone="negative" className="rounded-md">
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-border bg-card">
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left focus:outline-none"
              aria-expanded={open}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-fast",
                  open && "rotate-90",
                )}
              />
              <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", style.badge)}>
                {style.label}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  alert.acknowledged ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {alert.title}
              </span>
              <time className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatTime(alert.triggeredAt)}
              </time>
            </button>
          </CollapsibleTrigger>
          {!alert.acknowledged && (
            <button
              type="button"
              onClick={onAck}
              aria-label="Acknowledge"
              className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {alert.description ?? "No further details."}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlowingEffect>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
