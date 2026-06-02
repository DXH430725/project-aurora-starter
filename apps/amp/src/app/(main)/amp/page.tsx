import { AlertCircle, CheckCircle2, Clock, ServerCrash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/data/metric-card";
import { StatusDot, type StatusKind } from "@/components/data/status-dot";
import { formatPercent, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { readAmpOverview, type AmpRun, type AmpTaskOverview } from "@/app/lib/amp-api";

function statusKind(status: string): StatusKind {
  switch (status.toUpperCase()) {
    case "ENABLED":
    case "READY":
    case "SUCCESS":
      return "active";
    case "FAILED":
    case "TIMEOUT":
      return "error";
    case "RUNNING":
    case "PENDING":
      return "warning";
    case "DISABLED":
    case "SKIPPED":
      return "idle";
    default:
      return "offline";
  }
}

function badgeVariant(status: string): "positive" | "negative" | "warning" | "neutral" {
  switch (status.toUpperCase()) {
    case "ENABLED":
    case "READY":
    case "SUCCESS":
      return "positive";
    case "FAILED":
    case "TIMEOUT":
      return "negative";
    case "RUNNING":
    case "PENDING":
      return "warning";
    default:
      return "neutral";
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "—";
  return formatRelativeTime(timestamp);
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.round(seconds / 60)} min`;
}

function latestRun(task: AmpTaskOverview): AmpRun | undefined {
  return task.runs[0];
}

function TaskTable({ tasks }: { tasks: AmpTaskOverview[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>任务列表</CardTitle>
        <CardDescription>只读视图：状态、调度、指标与最近运行结果。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Success</TableHead>
              <TableHead>Latest</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((item) => {
              const run = latestRun(item);
              return (
                <TableRow key={item.task.id}>
                  <TableCell className="min-w-56">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.task.name || item.task.id}</span>
                      <span className="font-mono text-xs text-muted-foreground">{item.task.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(item.task.status)}>{item.task.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span>{item.task.schedule_type}</span>
                      <span className="font-mono text-xs">{item.task.schedule_value}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {item.metrics?.total_runs ?? 0}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatPercent((item.metrics?.success_rate ?? 0) * 100, 1)}
                  </TableCell>
                  <TableCell>
                    {run ? (
                      <div className="flex flex-col gap-1">
                        <StatusDot status={statusKind(run.status)} label={run.status} pulse={false} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(run.finished_at || run.created_at)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No runs</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentRuns({ tasks }: { tasks: AmpTaskOverview[] }) {
  const runs = tasks
    .flatMap((task) =>
      task.runs.map((run) => ({
        ...run,
        taskName: task.task.name || task.task.id,
      })),
    )
    .sort((a, b) => Date.parse(b.created_at || "") - Date.parse(a.created_at || ""))
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近运行</CardTitle>
        <CardDescription>跨任务最近 8 条 run。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {runs.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无运行记录。</div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{run.taskName}</div>
                <div className="font-mono text-xs text-muted-foreground">{run.id}</div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDuration(run.duration_ms)}
                </span>
                <Badge variant={badgeVariant(run.status)}>{run.status}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default async function AmpPage() {
  let overview;
  try {
    overview = await readAmpOverview();
  } catch (error) {
    return (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <p className="text-xs uppercase text-muted-foreground">AMP</p>
          <h1 className="text-2xl font-medium">AMP 任务</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Aurora 无法连接 AMP API。请检查 amp-api.service 和 AMP_API_INTERNAL_URL。
          </p>
        </section>

        <Card className="max-w-3xl border-negative/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerCrash className="h-4 w-4 text-negative" />
              AMP API unreachable
            </CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "unknown_error"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalRuns = overview.tasks.reduce(
    (total, item) => total + (item.metrics?.total_runs ?? 0),
    0,
  );
  const failedRuns = overview.tasks.reduce(
    (total, item) =>
      total + (item.metrics?.failed_runs ?? 0) + (item.metrics?.timeout_runs ?? 0),
    0,
  );
  const enabledTasks = overview.tasks.filter((item) => item.task.status === "ENABLED").length;
  const latestFailure = overview.tasks.some((item) => {
    const lastFailure = item.metrics?.last_failure_at
      ? Date.parse(item.metrics.last_failure_at)
      : 0;
    const lastSuccess = item.metrics?.last_success_at
      ? Date.parse(item.metrics.last_success_at)
      : 0;
    return lastFailure > lastSuccess;
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase text-muted-foreground">AMP</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium">AMP 任务</h1>
          <Badge variant={latestFailure ? "warning" : "positive"} className="gap-1.5">
            {latestFailure ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {latestFailure ? "Needs review" : "Healthy"}
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          AMP 平台只读概览，展示任务注册状态、调度配置、历史指标与最近运行。
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tasks" value={overview.tasks.length} precision={0} />
        <MetricCard label="Enabled" value={enabledTasks} precision={0} />
        <MetricCard label="Runs" value={totalRuns} precision={0} />
        <MetricCard
          label="Failed"
          value={failedRuns}
          precision={0}
          stale={failedRuns > 0}
          className={cn(failedRuns > 0 && "border-warning/50")}
        />
      </section>

      {overview.tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              暂无任务
            </CardTitle>
            <CardDescription>AMP API 已连接，但当前没有注册任务。</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <TaskTable tasks={overview.tasks} />
          <RecentRuns tasks={overview.tasks} />
        </>
      )}
    </div>
  );
}
