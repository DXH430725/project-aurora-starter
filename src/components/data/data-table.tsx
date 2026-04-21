"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: keyof T & string;
  header: string;
  className?: string;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  /** Stable identifier for row-update flash. */
  rowKey: (row: T) => string;
  /** Optional empty state */
  emptyLabel?: string;
  className?: string;
}

const VIRTUAL_THRESHOLD = 200;

function alignClass(a?: "left" | "right" | "center") {
  return a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";
}

/**
 * Tracks each row's "flash until" timestamp based on a content signature.
 * When the content signature changes, the row flashes for 200ms.
 */
function useRowFlash<T>(rows: T[], rowKey: (row: T) => string): Set<string> {
  const prevSig = React.useRef<Map<string, string>>(new Map());
  const [flashing, setFlashing] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const added: string[] = [];
    const sigs = new Map<string, string>();
    for (const r of rows) {
      const id = rowKey(r);
      const sig = JSON.stringify(r);
      sigs.set(id, sig);
      if (prevSig.current.has(id) && prevSig.current.get(id) !== sig) {
        added.push(id);
      }
    }
    prevSig.current = sigs;
    if (added.length === 0) return;
    setFlashing((s) => {
      const next = new Set(s);
      for (const id of added) next.add(id);
      return next;
    });
    const to = setTimeout(() => {
      setFlashing((s) => {
        const next = new Set(s);
        for (const id of added) next.delete(id);
        return next;
      });
    }, 240);
    return () => clearTimeout(to);
  }, [rows, rowKey]);

  return flashing;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyLabel = "No data",
  className,
}: DataTableProps<T>) {
  const flashing = useRowFlash(rows, rowKey);
  if (rows.length >= VIRTUAL_THRESHOLD) {
    return <VirtualDataTable columns={columns} rows={rows} rowKey={rowKey} className={className} />;
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className={cn(alignClass(c.align), c.className)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = rowKey(row);
              const isFlashing = flashing.has(id);
              return (
                <TableRow key={id} className={cn(isFlashing && "animate-row-flash")}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(alignClass(c.align), c.className)}>
                      {c.cell ? c.cell(row) : String(row[c.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function VirtualDataTable<T>({
  columns,
  rows,
  rowKey,
  className,
}: DataTableProps<T>) {
  const flashing = useRowFlash(rows, rowKey);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const total = virtualizer.getTotalSize();
  const items = virtualizer.getVirtualItems();

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
        {columns.map((c) => (
          <div
            key={c.key}
            className={cn(
              "px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
              alignClass(c.align),
              c.className,
            )}
          >
            {c.header}
          </div>
        ))}
      </div>
      <div ref={parentRef} className="max-h-[60vh] overflow-auto">
        <div style={{ height: total, position: "relative" }}>
          {items.map((item) => {
            const row = rows[item.index];
            const id = rowKey(row);
            const isFlashing = flashing.has(id);
            return (
              <div
                key={id}
                className={cn(
                  "grid border-b border-border",
                  isFlashing && "animate-row-flash",
                )}
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))`,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${item.start}px)`,
                  height: item.size,
                }}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm",
                      alignClass(c.align),
                      c.className,
                    )}
                  >
                    {c.cell ? c.cell(row) : String(row[c.key] ?? "—")}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { VirtualDataTable };
