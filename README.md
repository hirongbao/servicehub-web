# ServiceHub Web

ServiceHub 管理后台前端，基于 Vue 3、Vite 和 Tailwind CSS 的单页应用，通过本地 Express 服务器承载开发环境并把请求转发到后端。

## 功能特性

- **登录**：管理员账号密码登录，支持记住密码；登录凭证 30 天有效，临近过期时后端通过响应头自动续期，前端无感更新；401 自动回到登录页。
- **仪表盘**：有效凭证、有效路由、存储用量统计与最近图片预览。
- **访问凭证**：创建凭证（可选有效期与调用次数上限）、状态标签（启用/禁用/已过期）、启用/禁用切换、复制密钥、吊销。
- **短链路由**：创建短链（可选自定义短码与有效期）、二维码、复制短地址、删除、点击统计与按天趋势。
- **媒体资产**：上传图片（JPG、PNG、GIF、WEBP，最大 10MB）、网格预览、删除。

## 技术栈

Vue 3 · Vite 6 · Tailwind CSS 4 · Element Plus · lucide-vue-next · qrcode · Express（本地开发服务器）

## 本地开发

要求：Node.js 20+、npm 10+（仓库锁文件为 bun.lock，用 bun 亦可）。

```bash
npm install
npm run dev    # 实际执行 node server.js
```

本地服务器运行在 `http://localhost:3000`，以中间件方式挂载 Vite，并转发：

| 路径 | 目标 | 说明 |
| --- | --- | --- |
| `/api`、`/s` | `http://localhost:8080` | 后端业务接口与短链跳转（`BACKEND_URL` 可覆盖） |
| `/logs-ui` | `http://localhost:8111` | 日志查看器，支持 websocket（`LOG_VIEWER_URL` 可覆盖） |

服务端口可用 `PORT` 覆盖。

## 生产构建

```bash
npm run build    # 产物输出到 dist/
NODE_ENV=production npm start    # Express 托管 dist/，接口转发逻辑与开发环境一致
```

## 目录结构

```text
├── server.js       # 本地服务器：静态/中间件承载 + 接口转发
├── API.md          # 后端接口约定说明
├── index.html
└── src
    ├── main.js     # 应用入口，注册 Element Plus
    ├── style.css   # Tailwind 入口与少量自定义样式
    └── App.vue     # 登录页与控制台全部页面（单文件应用）
```

## 后端接口

依赖 [ServiceHub Backend](https://github.com/hirongbao/servicehub)，接口前缀为 `/api`，统一响应格式为 `{ code, data, message }`。管理端接口通过 `Authorization: Bearer <token>` 鉴权，后端在凭证临近过期时通过 `X-Renewed-Token` 响应头下发新凭证，前端请求层自动保存。

## 自动部署（systemd timer）

本项目在 WSL 中配置了基于 systemd user timer 的简易 CI/CD：每 2 分钟检查一次 GitHub 上 `main` 分支的最新 commit，若与上次已部署的 commit 不同，则自动重启 `servicehub-frontend` 服务（开发模式下 Vite 支持热更新，重启只是确保干净状态）。

日常开发中**推送到 GitHub 后无需手动重启服务**，最迟约 2 分钟后自动生效（本地提交但未推送不会触发部署）。

组成：

- 部署脚本：`~/projects/deploy-check.sh`（对比 `origin/main` 与 `~/.local/state/servicehub-deploy/frontend` 中记录的 commit）
- 定时器：`~/.config/systemd/user/servicehub-deploy.timer`，随 WSL 开机自启
- 查看部署日志：`journalctl --user -u servicehub-deploy -f`
- 临时停用自动部署：`systemctl --user disable --now servicehub-deploy.timer`
