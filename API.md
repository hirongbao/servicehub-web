# ServiceHub API 接口规范文档

为了完美适配前端重构后的界面，后端需遵循以下接口设计规范。

## 1. 全局数据通信约定

- **请求方法**：RESTful 规范 (`GET`, `POST`, `DELETE`)
- **JSON 响应统一格式**：
  ```json
  {
    "code": 0,                // 0 表示成功，非 0 表示业务逻辑错误
    "message": "success",     // 错误时的提示文案
    "data": { ... }           // 实际的核心数据
  }
  ```
- **分页查询约定**：前端发起请求时，URL 会附带 `?page=1&size=12` 查询参数。
- **分页响应约定**：`data` 字段应返回包含 `list` (数据数组) 和 `total` (总条数) 的对象。

## 2. 核心接口详情

### 2.1 获取工作区数据总览
- **接口**：`GET /api/overview`
- **响应** `data`：
  ```json
  {
    "totalTokens": 10,
    "activeTokens": 8,
    "totalLinks": 150,
    "activeLinks": 142,
    "totalFiles": 32,
    "totalStorage": 10485760  // 可选，总存储字节数
  }
  ```

### 2.2 访问凭证模块 (Tokens)
- **获取凭证列表 (带分页)**：`GET /api/tokens?page=1&size=12`
  - 响应 `data`：
    ```json
    {
      "list": [
        {
          "id": "1",
          "tokenName": "前端上传凭证",
          "tokenType": "FILEHUB",   // 直接返回业务类型标识符，前端会原样渲染
          "tokenValue": "eyJh... (完整的Token密钥)",
          "usageCount": 15,         // 已使用次数
          "maxUses": 100,           // 0代表无限
          "status": 1,              // 1 正常, 0 吊销
          "expiresAt": "2026-12-31T23:59:59Z" // 时间戳或 ISO 字符串, 为null代表永久
        }
      ],
      "total": 45
    }
    ```
- **创建凭证**：`POST /api/tokens`
  - 请求 `Body`：
    ```json
    {
      "tokenName": "名称", 
      "tokenType": "FILEHUB", 
      "validDays": 30, 
      "maxUses": 0
    }
    ```
- **吊销凭证**：`DELETE /api/tokens/:id`

### 2.3 短链路由模块 (Links)
- **获取短链列表 (带分页)**：`GET /api/links?page=1&size=12`
  - 响应 `data`：
    ```json
    {
      "list": [
        {
          "id": "1",
          "remark": "官网首页",
          "code": "x7b9q",
          "targetUrl": "https://example.com/very/long/url",
          "visitCount": 1024,
          "status": 1,
          "expiresAt": null
        }
      ],
      "total": 150
    }
    ```
- **创建短链**：`POST /api/links`
  - 请求 `Body`：
    ```json
    {
      "targetUrl": "https...", 
      "code": "可为空(自定义)", 
      "remark": "备注", 
      "validDays": 30
    }
    ```
- **查看短链访问趋势**：`GET /api/links/:id/stats`
  - 响应 `data`：
    ```json
    {
      "total": 1024,
      "daily": [
        { "visitDate": "2026-08-23", "visits": 120 },
        { "visitDate": "2026-08-24", "visits": 150 }
      ]
    }
    ```
- **删除短链**：`DELETE /api/links/:id`

### 2.4 媒体资产模块 (Files)
- **获取文件列表 (带分页)**：`GET /api/files?page=1&size=12`
  - 响应 `data`：
    ```json
    {
      "list": [
        {
          "id": "1",
          "originalName": "hero_bg.png",
          "fileUrl": "https://your-bucket.com/assets/hero_bg.png",
          "fileSize": 204800 // 字节数
        }
      ],
      "total": 32
    }
    ```
- **上传文件**：`POST /api/files/upload`
  - 请求 `Headers`：`Content-Type: multipart/form-data`
  - 请求 `Body`：包含 `file` 字段的二进制流
- **删除文件**：`DELETE /api/files/:id`
