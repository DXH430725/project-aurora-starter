/**
 * Formatting helpers. All UI number rendering must go through these
 * so we have a single place to tweak locale/precision/rounding policy.
 */

const numberFmt = new Intl.NumberFormat("en-US");
const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatNumber(n: number | null | undefined, precision = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (precision > 0) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }
  return numberFmt.format(n);
}

export function formatCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return compactFmt.format(n);
}

export function formatCurrency(n: number | null | undefined, currency = "USD"): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(n: number | null | undefined, precision = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(precision)}%`;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[u]}`;
}

export function formatRelativeTime(target: Date | number | string): string {
  const ts = typeof target === "number" ? target : new Date(target).getTime();
  const delta = Math.round((ts - Date.now()) / 1000);
  const abs = Math.abs(delta);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (abs < 60) return rtf.format(delta, "second");
  if (abs < 3600) return rtf.format(Math.round(delta / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(delta / 3600), "hour");
  return rtf.format(Math.round(delta / 86_400), "day");
}

export function formatByType(
  v: number | null | undefined,
  format: "number" | "currency" | "percent" | "bytes" = "number",
  precision = 2,
): string {
  switch (format) {
    case "currency":
      return formatCurrency(v);
    case "percent":
      return formatPercent(v, precision);
    case "bytes":
      return formatBytes(v);
    default:
      return formatNumber(v, precision);
  }
}
