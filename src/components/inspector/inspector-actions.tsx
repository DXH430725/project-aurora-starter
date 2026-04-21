"use client";

import * as React from "react";
import { Download, Pause, Play, Trash2, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WSMessage } from "@/types/ws";

export interface InspectorActionsProps {
  paused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
  messages: WSMessage[];
  className?: string;
}

export function InspectorActions({
  paused,
  onTogglePause,
  onClear,
  messages,
  className,
}: InspectorActionsProps) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurora-inspector-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Action onClick={onTogglePause} label={paused ? "Resume" : "Pause"}>
        {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        <span>{paused ? "Resume" : "Pause"}</span>
      </Action>
      <Action onClick={onClear} label="Clear log">
        <Trash2 className="h-3.5 w-3.5" />
        <span>Clear</span>
      </Action>
      <Action onClick={exportJson} label="Export as JSON">
        <Download className="h-3.5 w-3.5" />
        <span>Export</span>
      </Action>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Coming in v1.1</TooltipContent>
      </Tooltip>
    </div>
  );
}

function Action({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs text-foreground transition-colors duration-fast hover:border-border-strong hover:bg-muted"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
