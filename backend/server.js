const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Load environment configuration (optimized for development speed)
const path = require('path');
if (process.env.NODE_ENV === 'development') {
  // Skip dotenv loading if critical env vars are already set (for faster startup)
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    require('dotenv').config({ path: path.join(__dirname, '.env.development') });
  }
} else {
  require('dotenv').config({ path: path.join(__dirname, 'config.env') });
}
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cluster = require('cluster');
const os = require('os');
const http = require('http'); // For Socket.IO integration
const socketService = require('./services/SocketService'); // Real-time updates
const { primeProductsFastCache } = require('./controllers/productControllerOptimized');

// Use clustering to take advantage of multi-core systems (disabled in development for faster startup)
const enableClustering = process.env.ENABLE_CLUSTERING === 'true' && process.env.NODE_ENV !== 'development';

if (enableClustering && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  const workerCount = Math.min(numCPUs, 4); // Limit to a maximum of 4 workers

  console.log(`🚀 Primary ${process.pid} is running`);
  console.log(`🧠 Starting ${workerCount} workers on ${numCPUs} CPU cores`);

  // Fork workers
  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  // Worker management: keep track of active workers
  let activeWorkers = new Set();

  cluster.on('online', (worker) => {
    activeWorkers.add(worker.id);
    console.log(`✅ Worker ${worker.process.pid} is online (Total: ${activeWorkers.size})`);
  });

  // Handle worker crashes
  cluster.on('exit', (worker, code, signal) => {
    activeWorkers.delete(worker.id);
    console.log(`⚠️ Worker ${worker.process.pid} died (${signal || code}). Restarting... (Active: ${activeWorkers.size})`);

    // Only spawn a new worker if it wasn't an intentional shutdown
    if (!worker.exitedAfterDisconnect) {
      const newWorker = cluster.fork();
      console.log(`🔄 New worker ${newWorker.process.pid} spawned`);
    }
  });

  // Monitor worker health
  setInterval(() => {
    console.log(`🔍 Cluster status: ${activeWorkers.size} active workers`);

    // Check memory usage (simplified example)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024);
    console.log(`📊 Memory usage: ${memoryUsageMB} MB`);

    // Could restart workers if memory exceeds threshold
    if (memoryUsageMB > 1500) { // Example: 1.5 GB threshold
      console.log(`⚠️ High memory usage detected: ${memoryUsageMB} MB. Consider restarting workers.`);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down primary process...');

    // Tell workers to finish their current requests and then exit
    Object.values(cluster.workers).forEach(worker => {
      worker.send('shutdown');
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.log('⏱️ Graceful shutdown timed out, forcing exit.');
      process.exit(1);
    }, 5000);
  });
} else {

  const app = express();

  // Middleware
  app.set('trust proxy', 1);

  // CORS Configuration - Backend handles CORS for all environments
  const cors = require('cors');

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://aliboboqurilish.uz',
    'https://www.aliboboqurilish.uz'
  ];

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow all origins in development
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Check allowed origins in production
      if (allowedOrigins.includes(origin) ||
        origin.endsWith('.aliboboqurilish.uz')) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // Cache preflight for 24 hours
  }));

  console.log('🌐 CORS enabled on backend for origins:', allowedOrigins);

  // Security middleware (simplified in development for faster startup)
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
  } else {
    // Minimal helmet config for development
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
  }

  // Compression middleware - prioritize speed
  app.use(compression({
    level: 6, // Balanced between speed and compression ratio (0-9)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress responses with this header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Don't compress images or other binary files that are already compressed
      const contentType = res.getHeader('Content-Type');
      if (contentType && (
        contentType.includes('image/') ||
        contentType.includes('video/') ||
        contentType.includes('audio/') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/zip') ||
        contentType.includes('font/') ||
        contentType.includes('application/octet-stream')
      )) {
        return false;
      }
      // Use compression filter
      return compression.filter(req, res);
    },
    // Add a custom threshold function based on request size
    threshold: function (req, res) {
      // Don't bother compressing small responses
      const contentLength = parseInt(res.getHeader('Content-Length'), 10);
      return contentLength > 1024; // Only compress responses > 1KB
    }
  }));

  // Query timeout middleware for performance
  const { queryTimeoutMiddleware, handleQueryTimeout } = require('./middleware/queryTimeout');
  app.use(queryTimeoutMiddleware(5000)); // 5 second timeout for all queries

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Rate limiting for API endpoints - disable in development
  if (process.env.NODE_ENV !== 'development') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '50000'),
      standardHeaders: true,
      legacyHeaders: false,
      // Skip rate limiting for some trusted IPs
      skip: (req) => {
        const trustedIps = (process.env.TRUSTED_IPS || '').split(',');
        return trustedIps.includes(req.ip);
      },
      message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.'
      }
    });
    app.use('/api', limiter);
  } else {
    // Very high rate limits for development to prevent 429 errors
    const devLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100000, // Very high limit for development
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests',
        message: 'Development rate limit exceeded. Please try again later.'
      }
    });
    app.use('/api', devLimiter);
  }

  // Additional stricter rate limiting for specific high-traffic endpoints - disable in development
  if (process.env.NODE_ENV !== 'development') {
    const strictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10000, // Much higher limits
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit for this endpoint. Please try again later.'
      }
    });

    // Apply stricter rate limiting to craftsmen and products endpoints
    app.use('/api/craftsmen', strictLimiter);
    app.use('/api/products', strictLimiter);
  } else {
    // Very high rate limits for development to prevent 429 errors
    const devStrictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100000, // Very high limit for development
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests',
        message: 'Development rate limit exceeded. Please try again later.'
      }
    });

    // Apply high rate limiting to craftsmen and products endpoints in development
    app.use('/api/craftsmen', devStrictLimiter);
    app.use('/api/products', devStrictLimiter);
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CRITICAL: Add cache control headers for real-time updates
  app.use((req, res, next) => {
    // Products can be cached briefly to boost speed without UI changes
    if (req.path.startsWith('/api/products')) {
      // In production, allow short public caching; dev stays no-store for easier debugging
      const productsCache = process.env.NODE_ENV === 'development'
        ? 'no-store'
        : 'public, max-age=30, stale-while-revalidate=60';
      res.set({ 'Cache-Control': productsCache });
    } else if (req.path.startsWith('/api/craftsmen')) {
      const craftsmenCache = process.env.NODE_ENV === 'development'
        ? 'no-store'
        : 'public, max-age=30, stale-while-revalidate=60';
      res.set({ 'Cache-Control': craftsmenCache });
    } else if (req.path.startsWith('/api/orders')) {
      // Orders should not be cached client-side
      res.set({ 'Cache-Control': 'private, no-store' });
    }
    // Let Express compute proper ETag from response body (don’t rotate per-request)
    next();
  });

  // Ultra-light microcache for GET /api/products to absorb bursts (UI remains unchanged)
  const createMicroCache = (ttlMs = 5000) => {
    const store = new Map();
    return (req, res, next) => {
      if (req.method !== 'GET') return next();

      const key = req.originalUrl;
      const now = Date.now();
      const hit = store.get(key);

      if (hit && now - hit.time < ttlMs) {
        try {
          res.set('X-MicroCache', 'HIT');
          if (hit.headers) {
            Object.entries(hit.headers).forEach(([k, v]) => {
              try { res.setHeader(k, v); } catch {}
            });
          }
        } catch {}
        return res.send(hit.body);
      }

      const originalSend = res.send.bind(res);
      res.send = (body) => {
        try {
          const headers = typeof res.getHeaders === 'function' ? res.getHeaders() : {};
          store.set(key, { time: Date.now(), body, headers });
          res.set('X-MicroCache', 'MISS');
        } catch {}
        return originalSend(body);
      };

      next();
    };
  };

  // Apply microcache to products API before route registration (single registration)
  const microTtl = parseInt(process.env.MICROCACHE_TTL_MS || '5000', 10);
  app.use('/api/products', createMicroCache(microTtl));
  app.use('/api/craftsmen', createMicroCache(microTtl));

  // Ensure uploads directory exists
  const fs = require('fs');
  const uploadsDir = 'uploads/products';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created uploads directory: ${uploadsDir}`);
  } else {
    console.log(`✅ Uploads directory exists: ${uploadsDir}`);
  }

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads', {
    maxAge: process.env.NODE_ENV === 'development' ? '0' : '7d', // No cache in development, 7 days in production
    etag: true, // Generate ETags for caching
    setHeaders: (res, path, stat) => {
      if (process.env.NODE_ENV === 'development') {
        // Development: No caching for easier debugging
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        if (process.env.DEBUG === 'true') {
          console.log(`[STATIC] Serving image: ${path}`);
        }
      } else {
        // Production: 7 days cache
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    }
  }));

  // Add logging middleware for image requests in development
  if (process.env.NODE_ENV === 'development') {
    app.use('/uploads', (req, res, next) => {
      const origin = req.get('Origin') || req.get('Referer') || 'direct';
      const startTime = Date.now();

      if (process.env.DEBUG === 'true') {
        console.log(`[IMAGE REQUEST] ${req.method} ${req.url} from ${origin}`);
      }

      // Log response after it's sent
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const statusEmoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';

        if (process.env.DEBUG === 'true') {
          console.log(`[IMAGE RESPONSE] ${statusEmoji} ${status} ${req.url} (${duration}ms)`);
        }
      });

      // Add development-specific headers for better debugging
      res.setHeader('X-Served-By', 'alibobo-backend');
      res.setHeader('X-Environment', 'development');
      next();
    });
  }

  // Serve static files from the React app build directory
  const path = require('path');

  // Function to check if build directory is valid and has index.html
  const isBuildDirValid = () => {
    try {
      const buildDir = path.join(__dirname, '..', 'build');
      const indexPath = path.join(buildDir, 'index.html');
      return fs.existsSync(buildDir) && fs.lstatSync(buildDir).isDirectory() && fs.existsSync(indexPath);
    } catch (err) {
      console.log('⚠️ Error checking build directory:', err.message);
      return false;
    }
  };

  const buildDir = path.join(__dirname, '..', 'build');

  if (isBuildDirValid()) {
    console.log('✅ Build directory found with index.html, serving static files');
    app.use(express.static(buildDir));

    // Serve the React app for any non-API routes
    app.get('*', (req, res, next) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return next();
      }

      // Check if the requested file exists
      const requestedFile = path.join(buildDir, req.path);
      fs.access(requestedFile, fs.constants.F_OK, (err) => {
        if (err) {
          // File doesn't exist, serve index.html for client-side routing
          const indexPath = path.join(buildDir, 'index.html');
          res.sendFile(indexPath, (err) => {
            if (err) {
              console.error('❌ Error serving index.html:', err.message);
              next(err);
            }
          });
        } else {
          // File exists, let express.static handle it
          next();
        }
      });
    });
  } else {
    console.log('⚠️ Build directory with index.html not found, skipping static file serving');
    // If no build directory, show a simple API message for root route
    app.get('/', (req, res) => {
      res.json({
        message: 'Alibobo Backend API',
        version: '1.0.0',
        status: 'Running',
        note: 'Frontend build not found - run "npm run build" to generate frontend files'
      });
    });
  }

  // Routes
  const productRoutes = require('./routes/productRoutes');
  const craftsmenRoutes = require('./routes/craftsmenRoutes');
  const notificationsRoutes = require('./routes/notificationsRoutes');
  const ordersRoutes = require('./routes/ordersRoutes');
  const statisticsRoutes = require('./routes/statisticsRoutes');
  const uploadRoutes = require('./routes/uploadRoutes');
  const { router: recentActivitiesRoutes } = require('./routes/recentActivitiesRoutes');

  app.use('/api/products', productRoutes); // This now includes the fast endpoint
  app.use('/api/base64', require('./routes/base64Routes'));
  app.use('/api/craftsmen', craftsmenRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/statistics', statisticsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/recent-activities', recentActivitiesRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Alibobo Backend Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Alibobo Backend API',
      version: '1.0.0',
      endpoints: {
        products: '/api/products',
        craftsmen: '/api/craftsmen',
        notifications: '/api/notifications',
        orders: '/api/orders',
        statistics: '/api/statistics',
        upload: '/api/upload',
        recentActivities: '/api/recent-activities',
        health: '/api/health'
      }
    });
  });

  // Handle worker messages for graceful shutdown
  if (cluster.isWorker) {
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        console.log(`🛑 Worker ${process.pid} received shutdown signal`);

        // Stop accepting new connections - server will be defined in startServer
        setTimeout(() => {
          console.log(`👋 Worker ${process.pid} closing server...`);
          process.exit(0);
        }, 1000);
      }
    });
  }

  // MongoDB Connection
  const connectDB = async () => {
    try {
      const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!uri) {
        console.error('❌ MongoDB URI is missing. Expected MONGODB_URI or MONGO_URI in environment.');
        return process.exit(1);
      }

      // Reduced logging for cleaner development experience
      if (process.env.DEBUG === 'true') {
        const usedVar = process.env.MONGODB_URI ? 'MONGODB_URI' : 'MONGO_URI';
        console.log(`ℹ️ Using ${usedVar} for MongoDB connection`);

        // Extra diagnostics only in debug mode
        mongoose.connection.on('connecting', () => console.log('⏳ MongoDB: connecting...'));
        mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB: disconnected'));
        mongoose.connection.on('reconnectFailed', () => console.log('❌ MongoDB: reconnect failed'));
      }

      // Always log successful connection and errors
      mongoose.connection.on('connected', () => console.log('✅ MongoDB: connected'));
      mongoose.connection.on('error', (err) => {
        // Suppress common development warnings
        if (err.message.includes('Index already exists') ||
          err.message.includes('suppressreservedkeyswarning') ||
          err.message.includes('isNew')) {
          return;
        }
        console.error('❌ MongoDB connection error:', err?.message || err);
      });

      // ULTRA-OPTIMIZED connection options for maximum performance
      const isDevelopment = process.env.NODE_ENV === 'development';
      const conn = await mongoose.connect(uri, {
        // Connection timeouts - optimized for performance
        serverSelectionTimeoutMS: isDevelopment ? 10000 : 5000,  // Faster timeout for quick failure
        connectTimeoutMS: isDevelopment ? 10000 : 5000,          // Quick connection establishment
        socketTimeoutMS: isDevelopment ? 30000 : 15000,          // Reasonable socket timeout

        // Connection pooling - optimized for concurrent requests
        maxPoolSize: isDevelopment ? 10 : 25,    // Increased pool size for better concurrency
        minPoolSize: isDevelopment ? 2 : 5,      // Higher minimum to avoid connection overhead
        maxIdleTimeMS: 30000,                    // Close idle connections after 30s

        // Performance optimizations
        family: 4,                               // Prefer IPv4 for faster DNS resolution
        heartbeatFrequencyMS: 10000,             // More frequent heartbeats for faster failure detection
        bufferCommands: false,                   // Fail fast instead of buffering
        // bufferMaxEntries is deprecated, using bufferCommands: false instead

        // Reliability settings
        retryWrites: true,
        retryReads: true,
        readPreference: 'primary',               // Always read from primary for consistency

        // Compression for better network performance
        compressors: ['zlib'],
        zlibCompressionLevel: 6
      });
      if (process.env.DEBUG === 'true') {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      }

      // Create indexes if they don't exist (skip in development for faster startup)
      if (process.env.NODE_ENV !== 'production' && process.env.SKIP_INDEX_CREATION !== 'true') {
        if (process.env.DEBUG === 'true') {
          console.log('🔍 Ensuring indexes...');
        }
        const models = Object.values(mongoose.models);
        for (const model of models) {
          try {
            await model.ensureIndexes();
          } catch (err) {
            // Silently ignore index already exists errors
            if (!err.message.includes('Index already exists')) {
              console.error('Index creation error:', err.message);
            }
          }
        }
      } else if (process.env.NODE_ENV === 'development') {
        if (process.env.DEBUG === 'true') {
          console.log('⚡ Skipping index creation for faster development startup');
        }
      }
    } catch (err) {
      // Only log connection errors if not index-related
      if (!err.message.includes('Index already exists')) {
        console.error('❌ MongoDB connection error:', err.message || err);

        // Implement exponential backoff for connection retries
        const retryDelay = parseInt(process.env.MONGO_RETRY_DELAY || 10000, 10);
        if (process.env.DEBUG === 'true') {
          console.log(`🔄 Retrying connection in ${retryDelay / 1000} seconds...`);
        }
        setTimeout(connectDB, retryDelay);
      }
    }
  };

  // Start server
  const PORT = process.env.PORT || 5000; // Default to 5000 for local development
  let server; // Global reference to server for graceful shutdown

  const startServer = async () => {
    await connectDB();

    // Prime ultra-fast products cache for first pages (non-blocking)
    try {
      const pagesToPrime = (process.env.PRIME_PAGES || '1,2,3').split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean);
      const limitToPrime = parseInt(process.env.PRIME_LIMIT || '20', 10);
      primeProductsFastCache({ pages: pagesToPrime, limit: limitToPrime, sortBy: 'updatedAt', sortOrder: 'desc' })
        .then(() => { if (process.env.DEBUG === 'true') console.log('⚡ Primed products fast cache'); })
        .catch(err => { if (process.env.DEBUG === 'true') console.log('⚠️ Prime cache error:', err?.message || err); });
    } catch (_) {}

    // Create HTTP server for Socket.IO integration
    const httpServer = http.createServer(app);

    console.log('🔧 Initializing Socket.IO server...');

    // Initialize Socket.IO for real-time stock updates
    const io = socketService.initialize(httpServer);

    console.log('✅ Socket.IO server initialized');

    // Socket.IO events available: stock:updated, order:updated, stock:bulk_updated, product:availability_changed, admin:notification

    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      console.log(`⚠️  Redis adapter available for clustering: ${process.env.REDIS_URL}`);
      console.log(`⚠️  Uncomment Redis adapter code in server.js for production clustering`);
    }

    server = httpServer.listen(PORT, () => {
      console.log(`🚀 Backend ready on port ${PORT}`);
      console.log(`🌐 Server accessible at http://localhost:${PORT}`);

      if (enableClustering && process.env.DEBUG === 'true') {
        console.log(`📏 Worker ${process.pid} ready in cluster mode`);
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = async () => {
      console.log('🛑 Received shutdown signal, starting graceful shutdown...');

      // Attempt graceful shutdown of the server
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server close:', err);
        } else {
          console.log('✅ HTTP server closed successfully');
        }

        // Close MongoDB connection
        mongoose.connection.close(false).then(() => {
          console.log('✅ MongoDB connection closed');
          console.log('👋 Goodbye!');
          process.exit(0); // Exit with success code
        }).catch(err => {
          console.error('❌ Error closing MongoDB connection:', err);
          process.exit(1); // Exit with error code
        });
      });

      // Force shutdown after timeout
      setTimeout(() => {
        console.error('⏱️ Graceful shutdown timed out after 10s, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`❌ Error: ${err.message}`);
      server.close(() => {
        process.exit(1);
      });
    });

    return server;
  };

  startServer();

}
