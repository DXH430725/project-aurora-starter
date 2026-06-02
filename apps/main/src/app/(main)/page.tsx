import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DESTINATIONS, type DestinationGroup } from "@/app/lib/destinations";

const GROUPS: { key: DestinationGroup; title: string }[] = [
  { key: "core", title: "核心" },
  { key: "services", title: "服务" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Aurora
        </p>
        <h1 className="text-2xl font-medium">Aurora 控制台</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          主站门户统一聚合 Monitor、Status、AMP 与 sub2api 中转入口。
        </p>
      </section>

      {GROUPS.map((group) => {
        const items = DESTINATIONS.filter(
          (destination) => (destination.group ?? "core") === group.key,
        );

        if (!items.length) return null;

        return (
          <section key={group.key} className="flex flex-col gap-4">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {items.map(({ href, title, description, icon: Icon, external }) => {
                const inner = (
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
                );

                return external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    {inner}
                  </a>
                ) : href.startsWith("https://") ? (
                  <a key={href} href={href} className="group">
                    {inner}
                  </a>
                ) : (
                  <Link key={href} href={href} className="group">
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
