"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChannel } from "@/hooks/use-channel";
import { cn } from "@/lib/utils";

export type NodeHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface NodeHealth {
  id: string;
  name: string;
  status: NodeHealthStatus;
  cpu: number;
  memory: number;
  latency: number | null;
  updatedAt: number;
}

interface WSHealthData {
  id: string;
  name: string;
  status: NodeHealthStatus;
  cpu: number;
  memory: number;
  latency: number | null;
}

export interface NodeHealthGridProps {
  initialNodes?: NodeHealth[];
  onSamplesChange?: (samples: Record<string, { status: NodeHealthStatus; updatedAt: number }>) => void;
}

const STATUS_CLASS: Record<NodeHealthStatus, string> = {
  healthy: "bg-positive",
  degraded: "bg-warning",
  down: "bg-negative",
  unknown: "bg-muted",
};

export function NodeHealthGrid({ initialNodes, onSamplesChange }: NodeHealthGridProps) {
  const [nodes, setNodes] = React.useState<NodeHealth[]>(() => initialNodes ?? []);

  useChannel<WSHealthData>("node.health.*", (msg) => {
    if (msg.type !== "data" || !msg.data) return;
    const d = msg.data;
    setNodes((prev) => {
      const map = new Map(prev.map((n) => [n.id, n]));
      map.set(d.id, {
        id: d.id,
        name: d.name,
        status: d.status,
        cpu: d.cpu,
        memory: d.memory,
        latency: d.latency,
        updatedAt: msg.timestamp,
      });
      return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
    });
  });

  const onChangeRef = React.useRef(onSamplesChange);
  onChangeRef.current = onSamplesChange;
  React.useEffect(() => {
    if (!onChangeRef.current) return;
    const samples: Record<string, { status: NodeHealthStatus; updatedAt: number }> = {};
    for (const n of nodes) samples[n.id] = { status: n.status, updatedAt: n.updatedAt };
    onChangeRef.current(samples);
  }, [nodes]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {nodes.map((node) => (
        <Popover key={node.id}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${node.name} — ${node.status}`}
              className={cn(
                "h-8 w-8 rounded-sm border border-border transition-colors duration-fast hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                STATUS_CLASS[node.status],
              )}
            />
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56">
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-foreground">{node.name}</span>
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    node.status === "healthy" && "bg-positive-muted text-positive",
                    node.status === "degraded" && "bg-warning-muted text-warning",
                    node.status === "down" && "bg-negative-muted text-negative",
                    node.status === "unknown" && "bg-muted text-muted-foreground",
                  )}
                >
                  {node.status}
                </span>
              </div>
              <Row label="CPU" value={`${node.cpu}%`} />
              <Row label="Memory" value={`${node.memory}%`} />
              <Row label="Latency" value={node.latency == null ? "—" : `${node.latency} ms`} />
              <Row
                label="Updated"
                value={`${Math.max(0, Math.floor((Date.now() - node.updatedAt) / 1000))}s ago`}
              />
            </div>
          </PopoverContent>
        </Popover>
      ))}
      {nodes.length === 0 && (
        <div className="text-xs text-muted-foreground">Waiting for node health data…</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
