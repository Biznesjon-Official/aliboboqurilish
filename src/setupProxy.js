const { createProxyMiddleware } = require('http-proxy-middleware');
console.log('[proxy] setupProxy loaded');

module.exports = function (app) {
  console.log('[proxy] attaching middleware...');

  // Quick check route to verify setupProxy is active
  app.get('/_proxy_check', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // Proxy API requests to backend using a distinct prefix to avoid conflicts
  app.use(
    '/backend',
    createProxyMiddleware({
      target: 'https://aliboboqurilish.uz',
      changeOrigin: true,
      secure: true,
      logLevel: 'silent',
      xfwd: true,
      headers: {
        Accept: 'application/json'
      },
      pathRewrite: {
        '^/backend': '/api'
      },
      onError: (err, req, res) => {
        console.log('[proxy][backend] error for', req.method, req.originalUrl, err?.message);
        res.status(500).json({
          error: 'Backend service unavailable',
          message: 'Please ensure the backend service is reachable at aliboboqurilish.uz'
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        const ct = proxyRes.headers['content-type'] || '';
        console.log(`[proxy][backend] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode} ${ct}`);
      },
      onProxyReq: () => {
        // Silent proxy requests
      }
    })
  );

  // Legacy support: Proxy direct /api requests as well (some code still calls /api)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://aliboboqurilish.uz',
      changeOrigin: true,
      secure: true,
      logLevel: 'silent',
      xfwd: true,
      headers: { Accept: 'application/json' },
      onError: (err, req, res) => {
        console.log('[proxy][api-legacy] error for', req.method, req.originalUrl, err?.message);
        res.status(500).json({ error: 'Backend service unavailable' });
      },
      onProxyRes: (proxyRes, req, res) => {
        const ct = proxyRes.headers['content-type'] || '';
        console.log(`[proxy][api-legacy] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode} ${ct}`);
      }
    })
  );

  // Proxy uploads/static files to backend
  app.use( 
    '/uploads',
    createProxyMiddleware({
      target: 'https://aliboboqurilish.uz',
      changeOrigin: true,
      secure: true,
      logLevel: 'silent',
      xfwd: true,
      headers: {
        Accept: 'image/*'
      },
      onError: (err, req, res) => {
        // For image requests, we don't want to return JSON, just let it fail gracefully
        // The OptimizedImage component will handle the fallback
        console.log('[proxy][uploads] error for', req.method, req.originalUrl, err?.message);
        res.status(404).end();
      },
      onProxyRes: (proxyRes, req, res) => {
        const ct = proxyRes.headers['content-type'] || '';
        console.log(`[proxy][uploads] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode} ${ct}`);
      },
      onProxyReq: () => {
        // Silent upload requests
      }
    })
  );

  // Health check proxy for monitoring backend availability
  app.use(
    '/health',
    createProxyMiddleware({
      target: 'https://aliboboqurilish.uz',
      changeOrigin: true,
      secure: true,
      logLevel: 'silent',
      xfwd: true,
      pathRewrite: {
        '^/health': '/api/health'
      },
      onError: (err, req, res) => {
        console.log('[proxy][health] error for', req.method, req.originalUrl, err?.message);
        res.status(503).json({
          status: 'Backend Unavailable',
          message: 'Backend server is not responding'
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        const ct = proxyRes.headers['content-type'] || '';
        console.log(`[proxy][health] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode} ${ct}`);
      }
    })
  );
};