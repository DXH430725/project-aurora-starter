import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AmpPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">AMP</p>
        <h1 className="text-2xl font-medium">AMP 任务</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          自动化任务页面待接入；当前仅保留路由与导航入口，避免模板链接落到 404。
        </p>
      </section>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>待接入</CardTitle>
          <CardDescription>后端联调完成后在此接入任务列表、运行记录与成功率。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3" aria-disabled="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-5/6" />
          <Skeleton className="h-9 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}
