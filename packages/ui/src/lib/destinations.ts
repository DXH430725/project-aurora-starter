import {
  Activity,
  Inspect,
  ListChecks,
  Newspaper,
  Radio,
  type LucideIcon,
} from "lucide-react";

export type DestinationGroup = "core" | "ops" | "external";

export interface Destination {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  external?: boolean;
  inSidebar?: boolean;
  group?: DestinationGroup;
}

export const DESTINATIONS: Destination[] = [
  {
    href: "/monitor",
    label: "Monitor",
    title: "服务器监控",
    description: "实时性能指标、节点健康、图表。",
    icon: Activity,
    inSidebar: true,
    group: "core",
  },
  {
    href: "/amp",
    label: "Tasks",
    title: "AMP 任务",
    description: "自动化任务调度、运行记录、成功率。",
    icon: ListChecks,
    inSidebar: true,
    group: "core",
  },
  {
    href: "/intel",
    label: "Intel",
    title: "Intel Feed",
    description: "内容卡片、时间线、Markdown。",
    icon: Newspaper,
    inSidebar: true,
    group: "core",
  },
  {
    href: "/status",
    label: "Status",
    title: "System Status",
    description: "节点健康、uptime、告警。",
    icon: Radio,
    inSidebar: true,
    group: "ops",
  },
  {
    href: "/inspector",
    label: "Inspector",
    title: "WS Inspector",
    description: "WebSocket 调试面板（dev）。",
    icon: Inspect,
    inSidebar: true,
    group: "ops",
  },
  // External deployment example:
  // {
  //   href: "https://grafana.example.com",
  //   label: "Grafana",
  //   title: "Grafana",
  //   description: "Prometheus 看板（独立部署）。",
  //   icon: Activity,
  //   external: true,
  //   group: "external",
  // },
];

export const SIDEBAR_NAV = DESTINATIONS.filter((d) => d.inSidebar && !d.external);
