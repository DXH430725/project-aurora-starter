import { Activity, Home, ListChecks, Radio, type LucideIcon } from "lucide-react";

export interface Destination {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  inSidebar?: boolean;
}

export const SIDEBAR_NAV: Destination[] = [
  { href: "/monitor", label: "Monitor", icon: Activity, inSidebar: true },
  { href: "/status", label: "Status", icon: Radio, inSidebar: true },
  { href: "https://430123.xyz/", label: "Home", icon: Home, inSidebar: true },
  { href: "https://amp.430123.xyz/amp", label: "AMP", icon: ListChecks, inSidebar: true },
];
