"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TagListProps {
  tags: string[];
  selected?: string[];
  onTagClick?: (tag: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function TagList({ tags, selected, onTagClick, className, size = "md" }: TagListProps) {
  const activeSet = React.useMemo(() => new Set(selected ?? []), [selected]);
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tags.map((tag) => {
        const active = activeSet.has(tag);
        const content = (
          <span
            className={cn(
              "inline-flex items-center rounded-sm px-2 py-0.5 font-medium transition-colors duration-fast",
              size === "sm" ? "text-[11px]" : "text-xs",
              active
                ? "bg-primary/20 text-primary"
                : "bg-primary/10 text-primary hover:bg-primary/15",
              onTagClick && "cursor-pointer",
            )}
          >
            {tag}
          </span>
        );
        if (!onTagClick) return <span key={tag}>{content}</span>;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            aria-pressed={active}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
