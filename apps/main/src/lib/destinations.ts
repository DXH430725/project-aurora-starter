import {
  Activity,
  Cable,
  ListChecks,
  Radio,
  type LucideIcon,
} from "lucide-react";

export type DestinationGroup = "core" | "services";

export interface Destination {
  href: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  external?: boolean;
  inSidebar?: boolean;
  group: DestinationGroup;
}

export const DESTINATIONS: Destination[] = [
  {
    href: "/monitor",
    label: "Monitor",
    title: "Monitor",
    description: "Status 子站的节点性能曲线与概览。",
    icon: Activity,
    inSidebar: true,
    group: "core",
  },
  {
    href: "/status",
    label: "Status",
    title: "Status",
    description: "Status 子站的服务可用性与 7 天状态。",
    icon: Radio,
    inSidebar: true,
    group: "core",
  },
  {
    href: "/amp",
    label: "AMP",
    title: "AMP",
    description: "AMP 子站占位入口，后续接入任务平台。",
    icon: ListChecks,
    inSidebar: true,
    group: "core",
  },
  {
    href: "https://api.430123.xyz",
    label: "sub2api",
    title: "sub2api 中转",
    description: "现有 api.430123.xyz 后备反代入口，本工单不触碰。",
    icon: Cable,
    external: true,
    inSidebar: true,
    group: "services",
  },
];

export const SIDEBAR_NAV = DESTINATIONS.filter((destination) => destination.inSidebar);
