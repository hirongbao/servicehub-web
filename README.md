# ServiceHub Web

ServiceHub 管理后台，基于 Vue 3、Vite、Tailwind CSS 和 Express。

## 功能

- 管理员登录和凭证续期
- Service Token、文件资产和短链管理
- 短链访问统计
- 个人资料、社交名片和动态内容管理
- 动态分类、媒体和发布状态管理

## 本地开发

要求：Node.js 20+、npm 10+，并确保后端运行在 `8080`。

```bash
npm ci
npm run dev
```

默认地址为 `http://localhost:3000`。可用环境变量覆盖后端地址：

```dotenv
BACKEND_URL=http://127.0.0.1:8080
LOG_VIEWER_URL=http://127.0.0.1:8111
PORT=3000
```

## 构建与部署

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

推送 `main` 后，GitHub Actions 执行构建并调用服务器脚本：

```text
/opt/scripts/deploy-servicehub-admin.sh
```

生产环境变量位于服务器 `/opt/apps/servicehub-admin/shared/.env`，不要提交到仓库。

## 目录

```text
server.js  Express 开发/生产服务器与后端代理
src/       Vue 页面和组件
public/    静态资源
```
