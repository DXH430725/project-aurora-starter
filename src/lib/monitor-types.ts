export type MonitorMetric = "cpu" | "mem" | "disk" | "netRx" | "netTx";

export interface MonitorNodeSnapshot {
  instance: string;
  region: string;
  up: 0 | 1;
  cpu: number | null;
  mem: number | null;
  disk: number | null;
  netRxBps: number | null;
  netTxBps: number | null;
}

export interface MonitorSnapshotResponse {
  at: number;
  nodes: MonitorNodeSnapshot[];
}

export interface MonitorRangeSeries {
  instance: string;
  region: string;
  points: Array<[epochSec: number, value: number]>;
}

export interface MonitorRangeResponse {
  metric: MonitorMetric;
  start: number;
  end: number;
  stepSec: number;
  series: MonitorRangeSeries[];
}

export type ServiceDayState = "ok" | "down" | "nodata";

export interface ServiceStatusDay {
  date: string;
  state: ServiceDayState;
  availability: number | null;
}

export interface ServiceStatusItem {
  name: string;
  target: string;
  currentUp: 0 | 1 | null;
  days: ServiceStatusDay[];
  uptime7d: number | null;
}

export interface StatusResponse {
  at: number;
  services: ServiceStatusItem[];
}

export interface MonitorErrorResponse {
  error: string;
}
