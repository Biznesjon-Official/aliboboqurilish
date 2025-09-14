const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy API requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'silent',
      onError: (err, req, res) => {
        // Silent error handling
        res.status(500).json({
          error: 'Backend service unavailable',
          message: 'Please ensure the backend server is running on port 5000'
        });
      },
      onProxyReq: () => {
        // Silent proxy requests
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
      logLevel: 'silent',
      onError: (err, req, res) => {
        // For image requests, we don't want to return JSON, just let it fail gracefully
        // The OptimizedImage component will handle the fallback
        res.status(404).end();
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
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'silent',
      pathRewrite: {
        '^/health': '/api/health'
      },
      onError: (err, req, res) => {
        res.status(503).json({
          status: 'Backend Unavailable',
          message: 'Backend server is not responding'
        });
      }
    })
  );
};