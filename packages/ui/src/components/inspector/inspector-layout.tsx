"use client";

import * as React from "react";
import { MetricsBar } from "@/components/inspector/metrics-bar";
import { ChannelList } from "@/components/inspector/channel-list";
import { MessageStream } from "@/components/inspector/message-stream";
import { InspectorActions } from "@/components/inspector/inspector-actions";
import { useWSStore } from "@/stores/ws-store";
import type { WSMessage } from "@/types/ws";

const SAMPLE_THRESHOLD = 100; // msg/s

export function InspectorLayout() {
  const messageLog = useWSStore((s) => s.messageLog);
  const clearLog = useWSStore((s) => s.clearLog);

  const [paused, setPaused] = React.useState(false);
  const pausedSnapshotRef = React.useRef<WSMessage[] | null>(null);
  const [selectedChannels, setSelectedChannels] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (paused && pausedSnapshotRef.current === null) {
      pausedSnapshotRef.current = messageLog;
    } else if (!paused) {
      pausedSnapshotRef.current = null;
    }
  }, [paused, messageLog]);

  const visibleRaw = paused ? (pausedSnapshotRef.current ?? messageLog) : messageLog;

  // Downsampling if rate too high
  const rate = React.useMemo(() => {
    if (visibleRaw.length < 2) return 0;
    const now = Date.now();
    const recent = visibleRaw.filter((m) => now - m.timestamp < 1_000);
    return recent.length;
  }, [visibleRaw]);
  const sampled = rate > SAMPLE_THRESHOLD;
  const downsampled = React.useMemo(() => {
    if (!sampled) return visibleRaw;
    return visibleRaw.filter((_, i) => i % 10 === 0);
  }, [sampled, visibleRaw]);

  const filtered = React.useMemo(() => {
    if (selectedChannels.size === 0) return downsampled;
    return downsampled.filter((m) => selectedChannels.has(m.channel));
  }, [downsampled, selectedChannels]);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const allChannels = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of messageLog) set.add(m.channel);
    return set;
  }, [messageLog]);

  const selectAll = () => setSelectedChannels(allChannels);
  const clearSelected = () => setSelectedChannels(new Set());

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">WS Inspector</h1>
        <p className="text-sm text-muted-foreground">
          Internal tool. Observe every message on the wire in real time.
        </p>
      </section>

      <MetricsBar />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <InspectorActions
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onClear={() => {
            clearLog();
            pausedSnapshotRef.current = null;
          }}
          messages={filtered}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <ChannelList
          messages={messageLog}
          selected={selectedChannels}
          onToggle={toggleChannel}
          onSelectAll={selectAll}
          onClear={clearSelected}
        />
        <MessageStream messages={filtered} sampled={sampled} />
      </div>
    </div>
  );
}
