"use client";

import * as React from "react";
import { GlareCard } from "@/components/effects/glare-card";
import { TagList } from "@/components/content/tag-list";
import { cn } from "@/lib/utils";

export type IntelImportance = "low" | "normal" | "high";

export interface IntelItem {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  source?: string;
  publishedAt: number; // ms
  importance?: IntelImportance;
}

export interface IntelCardProps {
  item: IntelItem;
  onClick?: (item: IntelItem) => void;
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function IntelCard({ item, onClick, onTagClick, className }: IntelCardProps) {
  const high = item.importance === "high";
  return (
    <GlareCard className={cn("h-full", className)}>
      <div className="relative flex h-full flex-col gap-3 p-4">
        {high && (
          <span
            aria-hidden
            className="absolute inset-y-3 left-0 w-[2px] rounded-full bg-primary"
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "text-sm font-medium leading-snug text-foreground",
              high && "pl-2",
            )}
          >
            <button
              type="button"
              onClick={() => onClick?.(item)}
              className="text-left transition-colors duration-fast hover:text-primary focus:outline-none focus-visible:text-primary"
            >
              {item.title}
            </button>
          </h3>
          <time className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatShort(item.publishedAt)}
          </time>
        </div>
        <p
          className={cn(
            "text-xs leading-relaxed text-muted-foreground line-clamp-3",
            high && "pl-2",
          )}
        >
          {item.summary}
        </p>
        <div className={cn("mt-auto flex items-center justify-between gap-2", high && "pl-2")}>
          <TagList tags={item.tags} size="sm" onTagClick={onTagClick} />
          {item.source && (
            <span className="shrink-0 text-[11px] text-muted-foreground">{item.source}</span>
          )}
        </div>
      </div>
    </GlareCard>
  );
}

function formatShort(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
