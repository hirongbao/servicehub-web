# ServiceHub Web

ServiceHub 管理后台前端，基于 Vue 3、Vite 和 Element Plus。提供管理员登录、服务概览、凭证管理和图片资源管理页面。

## 功能特性

- **登录**：管理员账号密码登录，凭证保存在本地。
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
