const { createProxyMiddleware } = require('http-proxy-middleware');

// Add a simple health check function
const checkBackendHealth = async () => {
  try {
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
    const response = await fetch(`${base}/health`);
    return response.ok;
  } catch (error) {
    console.log('⚠️ Backend not yet ready:', error.message);
    return false;
  }
};

module.exports = function(app) {
  // Proxy API requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      timeout: 30000, // 30 second timeout
      proxyTimeout: 30000, // 30 second proxy timeout
      retryDelay: 2000, // 2 second retry delay
      onError: (err, req, res) => {
        console.error('❌ Proxy error for /api:', err.message);
        console.log('🔍 Checking backend status...');
        
        // Check if backend is running
        checkBackendHealth().then(isHealthy => {
          if (!isHealthy) {
            console.log('❌ Backend server is not responding on port 5000');
            console.log('🛠️ Please ensure backend is running: npm run start:backend');
          }
        });
        
        if (!res.headersSent) {
          res.status(504).json({ 
            error: 'Backend service unavailable', 
            message: 'Backend server timeout - check if server is running on port 5000',
            timestamp: new Date().toISOString(),
            suggestion: 'Run: npm run start:backend'
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] 📡 ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] ✅ ${proxyRes.statusCode} ${req.url}`);
      }
    })
  );

  // Proxy uploads/static files to backend
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'silent', // Reduced logging for cleaner terminal
      onError: (err, req, res) => {
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.error('Proxy error for /uploads:', err.message);
        }
        // For image requests, we don't want to return JSON, just let it fail gracefully
        // The OptimizedImage component will handle the fallback
        res.status(404).end();
      },
      onProxyReq: (proxyReq, req, res) => {
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log(`[PROXY] Upload Request: ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
        }
      }
    })
  );

  // Health check proxy for monitoring backend availability
  app.use(
    '/health',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'silent',
      pathRewrite: {
        '^/health': '/api/health'
      },
      onError: (err, req, res) => {
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.error('Backend health check failed:', err.message);
        }
        res.status(503).json({ 
          status: 'Backend Unavailable',
          message: 'Backend server is not responding'
        });
      }
    })
  );

  // Socket.IO proxy for real-time communication
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      ws: true, // Enable WebSocket proxying
      logLevel: 'debug',
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err, req, res) => {
        console.error('❌ Socket.IO proxy error:', err.message);
        console.log('🔍 Check if backend Socket.IO server is running on port 5000');
        if (!res.headersSent) {
          res.status(504).end();
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[SOCKET.IO] 🔌 ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
      }
    })
  );
};