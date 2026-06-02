import { Activity, ListChecks, Radio, type LucideIcon } from "lucide-react";

export interface Destination {
  href: string;
  label: string;
  icon: LucideIcon;
  inSidebar?: boolean;
}

export const SIDEBAR_NAV: Destination[] = [
  { href: "/monitor", label: "Monitor", icon: Activity, inSidebar: true },
  { href: "/status", label: "Status", icon: Radio, inSidebar: true },
  { href: "/amp", label: "AMP", icon: ListChecks, inSidebar: true },
];
