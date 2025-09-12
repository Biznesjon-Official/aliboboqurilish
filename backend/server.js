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

// Remove CORS middleware since we're handling it at the Nginx level
// This prevents duplicate Access-Control-Allow-Origin headers

// Log that CORS is handled by Nginx in production
if (process.env.NODE_ENV === 'production') {
  console.log('🔒 CORS handled by Nginx in production');
} else {
  // Keep CORS for development since there's no Nginx proxy locally
  const cors = require('cors');
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost:3001', 
        'http://127.0.0.1:3001', 
        'https://aliboboqurilish.uz',
        'https://www.aliboboqurilish.uz'
      ];

  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Always allow requests in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️  CORS request from origin: ${origin}`);
        return callback(null, true);
      }
      
      // For production, be more permissive with allowed origins
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost:3001', 
        'http://127.0.0.1:3001', 
        'https://aliboboqurilish.uz',
        'https://www.aliboboqurilish.uz'
      ];
      
      // Check if the origin is in our allowed list or is a subdomain
      if (allowedOrigins.includes(origin) || 
          origin.endsWith('.aliboboqurilish.uz') || 
          origin.startsWith('https://aliboboqurilish.uz')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    maxAge: 86400, // CORS pre-flight results are cached for 1 day
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  }));

  // Log CORS configuration in development (only if debug enabled)
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
    console.log('🌐 CORS enabled for origins:', corsOrigins);
  }
}

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
  threshold: function(req, res) {
    // Don't bother compressing small responses
    const contentLength = parseInt(res.getHeader('Content-Length'), 10);
    return contentLength > 1024; // Only compress responses > 1KB
  }
}));

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
  // Prevent HTTP caching of API responses that contain real-time data
  if (req.path.startsWith('/api/products') || req.path.startsWith('/api/orders')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}"` // Force ETag rotation
    });
  }
  next();
});

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

    // Performance optimized connection options with increased timeouts for network latency
    const isDevelopment = process.env.NODE_ENV === 'development';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: isDevelopment ? 60000 : 60000, // Increased from 30000 to 60000 for high latency
      connectTimeoutMS: isDevelopment ? 60000 : 60000, // Increased from 30000 to 60000 for high latency
      socketTimeoutMS: isDevelopment ? 60000 : 60000, // Increased from 45000 to 60000 for high latency
      maxPoolSize: isDevelopment ? 5 : 10, // Reduced pool size to reduce connection overhead
      minPoolSize: isDevelopment ? 1 : 1,  // Smaller minimum pool
      family: 4,       // Prefer IPv4
      heartbeatFrequencyMS: isDevelopment ? 60000 : 45000, // Less frequent heartbeats to reduce load
      bufferCommands: true,
      retryWrites: true,
      retryReads: true,
      // Additional options for better connection stability
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      waitQueueTimeoutMS: 120000, // Increase wait queue timeout
      autoIndex: false // Disable autoIndex to reduce connection overhead
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
      const retryDelay = parseInt(process.env.MONGO_RETRY_DELAY || 15000, 10); // Increased from 10s to 15s
      if (process.env.DEBUG === 'true') {
        console.log(`🔄 Retrying connection in ${retryDelay/1000} seconds...`);
      }
      setTimeout(connectDB, retryDelay);
    }
  }
};

// Start server
const PORT = process.env.PORT || 5001; // Changed from 5000 to 5001 to avoid conflicts
let server; // Global reference to server for graceful shutdown

const startServer = async () => {
  await connectDB();
  
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
