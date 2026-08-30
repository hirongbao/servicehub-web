import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // In-memory persistent data store for the demo
  const tokens = [
    {
      id: 1,
      tokenName: '图床外链主凭证 (Production)',
      tokenType: 'FILEHUB',
      tokenValue: 'sk_live_filehub_9a8f2c710e344bd6931ae8288',
      expiresAt: new Date(Date.now() + 86400000 * 180).toISOString(),
      status: 1,
      usageCount: 1420,
      lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
    },
    {
      id: 2,
      tokenName: '博客自动化短链发布 (Ghost/Notion)',
      tokenType: 'LINKHUB',
      tokenValue: 'sk_live_linkhub_34f8a12dc99b42e584a713802',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      status: 1,
      usageCount: 388,
      lastUsedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
      id: 3,
      tokenName: '测试环境临时密钥',
      tokenType: 'FILEHUB',
      tokenValue: 'sk_test_temp_77c1d32fe1904a8895cb99471',
      expiresAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 0,
      usageCount: 42,
      lastUsedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 32).toISOString()
    }
  ];

  const now = new Date();
  const generateDailyStats = () => {
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      daily.push({
        visitDate: dateStr,
        visits: Math.floor(Math.random() * 80 + 15)
      });
    }
    return daily;
  };

  const links = [
    {
      id: 1,
      targetUrl: 'https://github.com/hirongbao/servicehub-web',
      code: 'repo',
      remark: 'GitHub 开源仓库主页',
      expiresAt: null,
      status: 1,
      visitCount: 1248,
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      dailyStats: generateDailyStats()
    },
    {
      id: 2,
      targetUrl: 'https://hirongbao.com/posts/modern-web-architecture',
      code: 'arch2026',
      remark: '个人技术架构博客深度长文',
      expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
      status: 1,
      visitCount: 652,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      dailyStats: generateDailyStats()
    },
    {
      id: 3,
      targetUrl: 'https://twitter.com',
      code: 'social',
      remark: '社交媒体主页跳转',
      expiresAt: new Date(Date.now() + 86400000 * 300).toISOString(),
      status: 1,
      visitCount: 189,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      dailyStats: generateDailyStats()
    }
  ];

  const files = [
    {
      id: 1,
      originalName: 'architectural-minimal-workspace.webp',
      fileSize: 482910,
      fileUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 2,
      originalName: 'nordic-interior-design-studio.jpg',
      fileSize: 842100,
      fileUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 3,
      originalName: 'geometric-concrete-monolith.webp',
      fileSize: 312040,
      fileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 4,
      originalName: 'ambient-gradient-dark-canvas.png',
      fileSize: 194820,
      fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];

  const isTokenExpired = t => t.expiresAt && new Date(t.expiresAt) <= new Date();
  const isLinkExpired = l => l.expiresAt && new Date(l.expiresAt) <= new Date();

  // Mock API routes
  app.post('/api/admin/login', (req, res) => {
    res.json({ code: 0, data: { token: 'mock-jwt-token-servicehub' }, message: 'ok' });
  });

  app.post('/api/admin/logout', (req, res) => {
    res.json({ code: 0, data: null, message: 'ok' });
  });

  app.get('/api/overview', (req, res) => {
    const activeTokensCount = tokens.filter(t => t.status === 1 && !isTokenExpired(t)).length;
    const activeLinksCount = links.filter(l => l.status === 1 && !isLinkExpired(l)).length;

    res.json({
      code: 0,
      data: {
        activeTokens: activeTokensCount,
        totalTokens: tokens.length,
        activeLinks: activeLinksCount,
        totalLinks: links.length,
        totalFiles: files.length,
        recentTokens: tokens.slice(0, 5).map(t => ({
          ...t,
          active: t.status === 1 && !isTokenExpired(t)
        }))
      },
      message: 'ok'
    });
  });

  // Token endpoints
  app.get('/api/tokens', (req, res) => res.json({ code: 0, data: tokens }));
  app.post('/api/tokens', (req, res) => {
    const { tokenName, tokenType, validDays } = req.body;
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newToken = {
      id: Date.now(),
      tokenName,
      tokenType: tokenType || 'FILEHUB',
      tokenValue: `sk_live_${(tokenType || 'filehub').toLowerCase()}_${randomHex}`,
      expiresAt: validDays && Number(validDays) > 0 ? new Date(Date.now() + 86400000 * Number(validDays)).toISOString() : null,
      status: 1,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString()
    };
    tokens.unshift(newToken);
    res.json({ code: 0, data: newToken });
  });
  app.post('/api/tokens/:id/status', (req, res) => {
    const t = tokens.find(t => t.id == req.params.id);
    if (t) t.status = req.body.status;
    res.json({ code: 0, data: null });
  });
  app.delete('/api/tokens/:id', (req, res) => {
    const idx = tokens.findIndex(t => t.id == req.params.id);
    if (idx !== -1) tokens.splice(idx, 1);
    res.json({ code: 0, data: null });
  });

  // Shortlink endpoints
  app.get('/api/links', (req, res) => res.json({ code: 0, data: links }));
  app.post('/api/links', (req, res) => {
    const { targetUrl, code, remark, validDays } = req.body;
    const autoCode = code ? code.trim() : Math.random().toString(36).substring(2, 7);
    const newLink = {
      id: Date.now(),
      targetUrl: targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`,
      code: autoCode,
      remark: remark || '',
      expiresAt: validDays && Number(validDays) > 0 ? new Date(Date.now() + 86400000 * Number(validDays)).toISOString() : null,
      status: 1,
      visitCount: 0,
      createdAt: new Date().toISOString(),
      dailyStats: generateDailyStats()
    };
    links.unshift(newLink);
    res.json({ code: 0, data: newLink });
  });
  app.post('/api/links/:id/status', (req, res) => {
    const l = links.find(l => l.id == req.params.id);
    if (l) l.status = req.body.status;
    res.json({ code: 0, data: null });
  });
  app.delete('/api/links/:id', (req, res) => {
    const idx = links.findIndex(l => l.id == req.params.id);
    if (idx !== -1) links.splice(idx, 1);
    res.json({ code: 0, data: null });
  });
  app.get('/api/links/:id/stats', (req, res) => {
    const l = links.find(l => l.id == req.params.id);
    if (l) {
      if (!l.dailyStats) l.dailyStats = generateDailyStats();
      const totalVisits = l.visitCount || l.dailyStats.reduce((sum, d) => sum + d.visits, 0);
      res.json({ code: 0, data: { total: totalVisits, daily: l.dailyStats } });
    } else {
      res.json({ code: 0, data: { total: 0, daily: generateDailyStats() } });
    }
  });

  // Shortlink redirect endpoint: /s/:code
  app.get('/s/:code', (req, res) => {
    const l = links.find(item => item.code.toLowerCase() === req.params.code.toLowerCase());
    if (l && l.status === 1 && !isLinkExpired(l)) {
      l.visitCount = (l.visitCount || 0) + 1;
      return res.redirect(l.targetUrl);
    }
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>短链不存在或已失效</title><meta charset="utf-8"/></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #fff;">
          <div style="text-align: center;">
            <h1 style="font-size: 24px; margin-bottom: 8px;">短链接失效或不存在</h1>
            <p style="color: #94a3b8; font-size: 14px;">该链接可能已过期、已被禁用或输入有误。</p>
          </div>
        </body>
      </html>
    `);
  });

  // File endpoints
  app.get('/api/files', (req, res) => res.json({ code: 0, data: files }));
  app.delete('/api/files/:id', (req, res) => {
    const idx = files.findIndex(f => f.id == req.params.id);
    if (idx !== -1) files.splice(idx, 1);
    res.json({ code: 0, data: null });
  });

  // File upload simulation with dummy/data URLs
  app.post('/api/files/upload', (req, res) => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
    ];
    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    const newFile = {
      id: Date.now(),
      originalName: `upload_${new Date().toISOString().slice(0, 10)}_${Math.random().toString(36).substring(2, 7)}.jpg`,
      fileSize: Math.floor(Math.random() * 500000 + 150000),
      fileUrl: randomImg,
      createdAt: new Date().toISOString()
    };
    files.unshift(newFile);
    res.json({ code: 0, data: newFile });
  });

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
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

