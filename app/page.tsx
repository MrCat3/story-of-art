import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoopPanel } from "./loop-panel";

const runUrl =
  "https://cursor.com/agents/bc-c29cc150-453d-4317-9fb5-06284de154e2";
const docsUrl = "https://cursor.com/docs/cloud-agent";

const facts = [
  ["运行状态", "RUNNING"],
  ["模型", "Grok 4.7"],
  ["分支", "main"],
  ["来源", "Cursor Desktop"],
  ["页面端口", "43123"],
  ["核对日期", "2026-10-13"],
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">实测</Badge>
          <Badge variant="secondary">不是公网部署</Badge>
        </div>
        <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Cloud Agent 会把一个任务往下做，直到完成、卡住，或这次运行结束。
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          它不是你提过一句之后就永远转着的后台服务。你不在电脑前时它可以自己改代码、跑测试、打开页面；这一轮结束它就停。你再发消息，它再继续。
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["1", "接任务", "一条需求对应这一轮要做完的范围。"],
          ["2", "自己验证", "能跑的命令、测试和页面，它会自己跑。"],
          ["3", "交结果", "代码推上去。页面只在开发进程活着时能打开。"],
        ].map(([index, title, body]) => (
          <Card key={title} size="sm">
            <CardHeader>
              <CardDescription className="font-mono">{index}</CardDescription>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </section>

      <LoopPanel />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">这次运行</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          数字来自这次 Cloud Agent 的 run-info，以及 Cursor 文档里对 Cloud
          Agent 的说明。文档还写到完成后会交可合并的 PR；这次从零开始的会话要求先提交并推送，不自动开 PR，除非你明确要求。
        </p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
          {facts.map(([term, value]) => (
            <div key={term} className="bg-card px-4 py-3">
              <dt className="text-xs text-muted-foreground">{term}</dt>
              <dd className="mt-1 font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a className={buttonVariants({ variant: "default" })} href={runUrl}>
            打开这次运行
          </a>
          <a
            className={buttonVariants({ variant: "outline" })}
            href={docsUrl}
          >
            Cloud Agent 文档
          </a>
        </div>
      </section>
    </main>
  );
}
