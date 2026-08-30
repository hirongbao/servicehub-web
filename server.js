import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const LOG_VIEWER_URL = process.env.LOG_VIEWER_URL || 'http://localhost:8111';
const PORT = process.env.PORT || 3000;

// http-proxy-middleware 3.x 与 Express 5 的路径挂载不兼容，需根挂载后按前缀手动分发
async function startServer() {
  const app = express();

  // 开发接口全部转发到 ServiceHub 后端：/api 业务接口与 /s 短链跳转
  const backendProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: false,
    onError: (err, req, res) => {
      res.status(502).json({ code: 1, data: null, message: '后端服务不可用，请确认服务已在 8080 端口启动' });
    }
  });
  // 日志查看器挂在 /logs-ui，websocket 支持实时刷新
  const logsProxy = createProxyMiddleware({
    target: LOG_VIEWER_URL,
    changeOrigin: false,
    ws: true,
    onError: (err, req, res) => {
      res.status(502).send('日志查看器不可用');
    }
  });

  app.use((req, res, next) => {
    if (/^\/api(\/|$)/.test(req.url) || /^\/s(\/|$)/.test(req.url)) return backendProxy(req, res, next);
    if (/^\/logs-ui(\/|$)/.test(req.url)) return logsProxy(req, res, next);
    next();
  });

  // 代理之后的本地路由如需解析请求体再启用
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    import('path').then(path => {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.use((req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`API proxy target: ${BACKEND_URL}`);
  });

  server.on('upgrade', logsProxy.upgrade);
}

startServer();
