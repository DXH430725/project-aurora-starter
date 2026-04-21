"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/content/bento-grid";
import { IntelCard, type IntelItem } from "@/components/content/intel-card";
import { Timeline, type TimelineEvent } from "@/components/content/timeline";
import { TagList } from "@/components/content/tag-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChannel } from "@/hooks/use-channel";
import { generateIntelItems, generateTimelineEvents } from "@/lib/mock-data";

type TimeWindow = "1h" | "24h" | "7d" | "all";

interface IntelPushData {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string;
}

const WINDOWS: { value: TimeWindow; label: string; ms: number }[] = [
  { value: "1h", label: "Last hour", ms: 60 * 60 * 1000 },
  { value: "24h", label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { value: "all", label: "All time", ms: Number.POSITIVE_INFINITY },
];

export default function IntelPage() {
  const [items, setItems] = React.useState<IntelItem[]>(() => generateIntelItems(9));
  const [events, setEvents] = React.useState<TimelineEvent[]>(() =>
    generateTimelineEvents(6),
  );
  const [query, setQuery] = React.useState("");
  const [activeTags, setActiveTags] = React.useState<string[]>([]);
  const [windowKey, setWindowKey] = React.useState<TimeWindow>("24h");

  useChannel<IntelPushData>("intel.feed", (msg) => {
    if (msg.type !== "data" || !msg.data) return;
    const d = msg.data;
    const item: IntelItem = {
      id: d.id,
      title: d.title,
      summary: d.summary,
      tags: d.tags,
      source: "WS",
      publishedAt: new Date(d.publishedAt).getTime(),
      importance: "normal",
    };
    setItems((prev) =>
      prev.some((x) => x.id === item.id) ? prev : [item, ...prev].slice(0, 30),
    );
    setEvents((prev) =>
      [
        {
          id: `ev-${d.id}`,
          type: "info" as const,
          title: d.title,
          description: d.summary,
          timestamp: item.publishedAt,
        },
        ...prev,
      ].slice(0, 20),
    );
  });

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const windowMs =
    WINDOWS.find((w) => w.value === windowKey)?.ms ?? Number.POSITIVE_INFINITY;

  const filtered = React.useMemo(() => {
    const cutoff = Date.now() - windowMs;
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (it.publishedAt < cutoff) return false;
      if (activeTags.length && !activeTags.every((t) => it.tags.includes(t))) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, windowMs, query, activeTags]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">Intel Feed</h1>
        <p className="text-sm text-muted-foreground">
          Curated signal stream. Filter by tag, time window, or full-text search.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search intel…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-40">
            <Select value={windowKey} onValueChange={(v) => setWindowKey(v as TimeWindow)}>
              <SelectTrigger>
                <SelectValue placeholder="Time window" />
              </SelectTrigger>
              <SelectContent>
                {WINDOWS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {allTags.length > 0 && (
          <TagList tags={allTags} selected={activeTags} onTagClick={toggleTag} />
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No intel matches the current filters.
            </div>
          ) : (
            <BentoGrid>
              {filtered.map((item, idx) => (
                <BentoGridItem
                  key={item.id}
                  span={item.importance === "high" && idx === 0 ? "2" : "1"}
                >
                  <IntelCard item={item} onTagClick={toggleTag} />
                </BentoGridItem>
              ))}
            </BentoGrid>
          )}
        </div>

        <aside className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent events
          </h2>
          <Timeline events={events} />
        </aside>
      </section>
    </div>
  );
}
