# ServiceHub Web

ServiceHub 管理后台前端，基于 Vue 3、Vite 和 Element Plus。提供管理员登录、服务概览、凭证管理和图片资源管理页面。

## 功能特性

- **登录**：管理员账号密码登录，凭证保存在本地；支持记住密码，下次自动填入。
- **概览**：可用凭证数、云端图片数、服务状态和最近凭证列表。
- **凭证管理**：创建 Token（可选有效期）、按名称/状态搜索筛选、显示/复制、启用/禁用、删除。
- **图片资源**：上传图片（JPG、PNG、GIF、WEBP，最大 10MB）、网格预览、删除。

## 技术栈

Vue 3 · Vite 6 · Element Plus · Vue Router

## 本地开发

要求：Node.js 20+、npm 10+。

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`，并通过 Vite 代理将 `/api` 请求转发到本地后端 `http://localhost:8080`（见 `vite.config.js`）。需要指向其他后端时修改代理目标即可。

## 生产构建

```bash
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

注意：构建产物直接部署时需要保证同源（或反向代理）存在 `/api` 后端服务，前端所有请求均使用相对路径。

## 目录结构

```text
src
├── main.js      # 应用入口，注册 Element Plus
├── style.css    # 设计变量与全站样式
└── App.vue      # 登录页与控制台全部页面（单文件应用）
```

## 后端接口

依赖 [ServiceHub Backend](https://github.com/hirongbao/servicehub)，接口前缀为 `/api`，统一响应格式为 `{ code, data, message }`。

## 自动部署（systemd timer）

本项目在 WSL 中配置了基于 systemd user timer 的简易 CI/CD：每 2 分钟检查一次 GitHub 上 `main` 分支的最新 commit，若与上次已部署的 commit 不同，则自动重启 `servicehub-frontend` 服务（Vite 本身支持热更新，重启只是确保干净状态）。

日常开发中**推送到 GitHub 后无需手动重启服务**，最迟约 2 分钟后自动生效（本地提交但未推送不会触发部署）。

组成：

- 部署脚本：`~/projects/deploy-check.sh`（对比 `origin/main` 与 `~/.local/state/servicehub-deploy/frontend` 中记录的 commit）
- 定时器：`~/.config/systemd/user/servicehub-deploy.timer`，随 WSL 开机自启
- 查看部署日志：`journalctl --user -u servicehub-deploy -f`
- 临时停用自动部署：`systemctl --user disable --now servicehub-deploy.timer`
