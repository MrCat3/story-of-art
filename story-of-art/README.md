# 艺术的故事 · 入门导读

对照贡布里希《艺术的故事》（范景中译）的**原创浓缩**学习站：导论 + 28 章、作品看图、练习、对照与词汇。不是原书摘录。

## 本地运行

```bash
cd story-of-art
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:43124](http://127.0.0.1:43124)。

## 生成静态文件

```bash
npm run build
```

输出在 `dist/`：纯静态 HTML、JS、CSS，可放到任意静态托管。

## 作品图片

```bash
npm run images
```

从 **Wikimedia Commons** 按开放许可下载到 `public/images/`，并写入 `src/data/images.json`。脚本带限速与断点续传；遇 429 会自动等待重试。权利不清楚的几件现代作品仍放本地图，图注写明来源和「非商业学习用途」。

## 结构

- `src/data/chapters.ts` — 章纲与浓缩正文
- `src/data/works.ts` — 作品说明与「看这里」
- `src/data/derivatives.ts` — 对照、词典、边界
- `src/app.ts` — 单页路由（hash）
