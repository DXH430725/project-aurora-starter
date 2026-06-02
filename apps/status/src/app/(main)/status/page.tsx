"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useServiceStatus } from "@/hooks/use-monitor-api";
import type { ServiceStatusDay, ServiceStatusItem } from "@/lib/monitor-types";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function StatusPage() {
  const { data, loading, error } = useServiceStatus();

  if (error && !data) {
    return <StatusError message={error} />;
  }

  const services = data?.services ?? [];
  const downCount = services.filter((service) => service.currentUp === 0).length;
  const unknownCount = services.filter((service) => service.currentUp == null).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">服务状态</h1>
        <p className="text-sm text-muted-foreground">
          通过 BFF 读取 blackbox 探测结果；过去 7 天色条区分正常、故障与无数据。
        </p>
      </section>

      {error && <InlineWarning message={error} />}

      <StatusBanner downCount={downCount} unknownCount={unknownCount} loading={loading} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading && !services.length ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            services.map((service) => <ServiceRow key={service.target} service={service} />)
          )}
          {!loading && !services.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无服务状态数据。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusError({ message }: { message: string }) {
  return (
    <Card className="border-negative/40 bg-negative-muted/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium text-foreground">监控数据源不可达</h1>
          <p className="text-sm text-muted-foreground">
            {message || "监控数据源不可达"}，60s 后重试。
          </p>
        </div>
      </div>
    </Card>
  );
}

function InlineWarning({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-negative/40 bg-negative-muted/30 px-3 py-2 text-sm text-negative">
      {message}，60s 后重试。
    </div>
  );
}

function StatusBanner({
  downCount,
  unknownCount,
  loading,
}: {
  downCount: number;
  unknownCount: number;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-16 w-full" />;

  const hasIncident = downCount > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border px-4 py-3",
        hasIncident
          ? "border-negative/40 bg-negative-muted text-negative"
          : "border-positive/40 bg-positive-muted text-positive",
      )}
    >
      <div className="flex items-center gap-2">
        {hasIncident ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        <span className="text-sm font-medium">
          {hasIncident ? `${downCount} 个服务异常` : "所有服务运行正常"}
        </span>
      </div>
      {unknownCount > 0 && (
        <span className="text-xs text-muted-foreground">{unknownCount} 个服务暂无当前数据</span>
      )}
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceStatusItem }) {
  return (
    <article className="rounded-md border border-border bg-background/40 p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr_120px] lg:items-start">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{service.name}</h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">{service.target}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-8 gap-1.5">
            {service.days.map((day) => (
              <DaySegment key={day.date} day={day} />
            ))}
          </div>
          <div className="grid grid-cols-3 text-xs text-muted-foreground">
            <span>7 天前</span>
            <span className="text-center font-mono tabular-nums">
              {service.uptime7d == null ? "—" : `${formatPercent(service.uptime7d, 2)} 可用`}
            </span>
            <span className="text-right">今天</span>
          </div>
        </div>

        <div className="flex justify-start lg:justify-end">
          <StatusBadge currentUp={service.currentUp} />
        </div>
      </div>
    </article>
  );
}

function DaySegment({ day }: { day: ServiceStatusDay }) {
  const label =
    day.state === "nodata"
      ? `${day.date}: 无数据`
      : `${day.date}: ${formatPercent(day.availability, 2)} 可用`;

  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "h-full flex-1 rounded-[2px]",
        day.state === "ok" && "bg-positive",
        day.state === "down" && "bg-negative",
        day.state === "nodata" && "bg-muted-foreground/35",
      )}
    />
  );
}

function StatusBadge({ currentUp }: { currentUp: 0 | 1 | null }) {
  if (currentUp === 1) return <Badge variant="positive">Operational</Badge>;
  if (currentUp === 0) return <Badge variant="negative">Down</Badge>;
  return <Badge variant="neutral">Unknown</Badge>;
}
