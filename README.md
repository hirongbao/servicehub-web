# ServiceHub Admin Frontend

ServiceHub 管理后台前端，使用 Vue 3、Vite 和 Element Plus。v1 面向个人管理员，提供登录和 Token 管理页面。

## 本地开发

要求：Node.js 20+、npm 10+。

```bash
npm install
npm run dev
```

后端 API 默认规划为 `http://localhost:8080`，接入 API 时通过环境变量配置。

## 页面规划

- 登录页：管理员登录。
- Token 管理页：Token 列表、详情、创建、修改、启用/禁用和删除。

当前页面为可运行骨架，业务 API 尚未接入。
