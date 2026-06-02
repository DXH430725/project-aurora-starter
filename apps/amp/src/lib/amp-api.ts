export interface AmpTask {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  status: string;
  runtime_type: string;
  image: string;
  schedule_type: string;
  schedule_value: string;
  schedule_timezone?: string | null;
  concurrency_policy?: string | null;
  upstream_task_ids?: string[] | null;
  last_tested_at?: string | null;
  last_run_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AmpMetrics {
  task_id: string;
  total_runs: number;
  success_runs: number;
  failed_runs: number;
  skipped_runs: number;
  timeout_runs: number;
  success_rate: number;
  avg_duration_ms?: number | null;
  last_run_at?: string | null;
  last_success_at?: string | null;
  last_failure_at?: string | null;
  updated_at?: string | null;
}

export interface AmpRun {
  id: string;
  task_id: string;
  status: string;
  trigger_type: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  heartbeat_at?: string | null;
  duration_ms?: number | null;
  skip_reason?: string | null;
  created_at?: string | null;
}

export interface AmpTaskOverview {
  task: AmpTask;
  metrics: AmpMetrics | null;
  runs: AmpRun[];
}

export interface AmpOverview {
  tasks: AmpTaskOverview[];
  generated_at: string;
}

function getAmpApiBaseUrl(): string {
  return (process.env.AMP_API_INTERNAL_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function ampFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${getAmpApiBaseUrl()}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) {
    throw new Error(`amp_api_${response.status}`);
  }
  return (await response.json()) as T;
}

async function readTaskOverview(task: AmpTask): Promise<AmpTaskOverview> {
  const [metrics, runs] = await Promise.allSettled([
    ampFetch<AmpMetrics>(`/tasks/${encodeURIComponent(task.id)}/metrics`),
    ampFetch<AmpRun[]>(`/tasks/${encodeURIComponent(task.id)}/runs?limit=5`),
  ]);

  return {
    task,
    metrics: metrics.status === "fulfilled" ? metrics.value : null,
    runs: runs.status === "fulfilled" ? runs.value : [],
  };
}

export async function readAmpOverview(): Promise<AmpOverview> {
  const tasks = await ampFetch<AmpTask[]>("/tasks");
  const overview = await Promise.all(tasks.map((task) => readTaskOverview(task)));
  return {
    tasks: overview,
    generated_at: new Date().toISOString(),
  };
}
