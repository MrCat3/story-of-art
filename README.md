# Cloud Agent 说明页

这一页回答两件事：Cloud Agent 会不会接到需求就一直做到完，以及它能不能在做完后给你一个可打开的网页。

页面本身就是第二个问题的证据。它是这台云虚拟机上的 Next.js 开发服务器，不是公网部署。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

`/api/status` 返回当前进程是否在响应。页面上的「重新探测」会请求这个接口。

## 依据

- [Cursor Cloud Agents 文档](https://cursor.com/docs/cloud-agent)
- 这次运行：https://cursor.com/agents/bc-c29cc150-453d-4317-9fb5-06284de154e2
