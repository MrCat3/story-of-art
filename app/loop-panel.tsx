"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const panels = {
  continues: {
    label: "会继续做",
    title: "有明确任务时，它按这个回路往下走",
    points: [
      "读仓库、改文件、跑命令和测试，再根据失败结果改。",
      "有界面时会启动开发服务器，并在浏览器里点主要路径。",
      "这一轮做完会提交并推送。你再发一条消息，同一运行接着做。",
    ],
  },
  stops: {
    label: "会停",
    title: "下面任一条件成立，这一轮就停",
    points: [
      "它判断任务已经完成。这个判断会错，完成不等于做对。",
      "缺密钥、缺权限，或有一个必须你拍板的选择。",
      "请求越过它不能做的边界，例如可操作的攻击步骤。",
      "你停止运行，或这次云端运行被平台结束。",
    ],
  },
  page: {
    label: "网页能到哪",
    title: "能给你一个正在跑的页面，不能变出永久公网站",
    points: [
      "这一页就是证据：Next.js 开发服务器，端口 43123。",
      "地址只在这台云虚拟机的进程还活着时有效。",
      "Cursor 也可以给聊天旁的 Canvas。那是结论板，不是你的产品站点。",
      "要一个别人随时能打开的网址，需要另一次部署，这次没有做。",
    ],
  },
} as const;

type PanelId = keyof typeof panels;

type Status = {
  ok: boolean;
  port: number;
  now: string;
};

export function LoopPanel() {
  const [active, setActive] = useState<PanelId>("continues");
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panel = panels[active];

  async function refresh() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setStatus((await response.json()) as Status);
      setError(null);
    } catch (cause) {
      setStatus(null);
      setError(cause instanceof Error ? cause.message : "请求失败");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>点一下，看边界</CardTitle>
        <CardDescription>
          三个按钮只切换本页说明。下面的状态来自这台服务器自己的接口。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(panels) as PanelId[]).map((id) => (
            <Button
              key={id}
              variant={id === active ? "default" : "outline"}
              onClick={() => setActive(id)}
            >
              {panels[id].label}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => void refresh()}>
            重新探测
          </Button>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-base font-medium text-foreground">{panel.title}</h3>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground">
            {panel.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {status ? (
            <>
              <Badge>接口正常</Badge>
              <span className="font-mono text-muted-foreground">
                端口 {status.port} · {status.now}
              </span>
            </>
          ) : (
            <Badge variant="destructive">{error ?? "正在探测"}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
