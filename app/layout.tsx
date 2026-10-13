import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud Agent 会做到哪一步",
  description:
    "一次 Cloud Agent 运行会把任务做到完成、卡住或运行结束。这一页是该结论的可打开证明。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
