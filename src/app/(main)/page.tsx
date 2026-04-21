import Link from "next/link";
import { Activity, Newspaper, Radio, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SCENES = [
  {
    href: "/monitor",
    title: "Data Monitor",
    description: "Realtime metric cards, charts, and node tables.",
    icon: Activity,
  },
  {
    href: "/intel",
    title: "Intel Feed",
    description: "Content cards, timelines, and markdown details.",
    icon: Newspaper,
  },
  {
    href: "/status",
    title: "System Status",
    description: "Node health, uptime, logs, and alert triage.",
    icon: Radio,
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Project Aurora
        </p>
        <h1 className="text-2xl font-medium">A quiet window into your data.</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A dark, Linear-inspired dashboard template. Pick a scenario below to see the
          primitives in action, or wire it to a real backend via WebSocket.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SCENES.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-[transform,box-shadow,border-color] duration-normal group-hover:-translate-y-0.5 group-hover:border-border-strong group-hover:shadow-sm">
              <CardHeader className="flex-row items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
