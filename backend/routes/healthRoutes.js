const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Quick response for health check
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Fast products endpoint for health check
router.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: Date.now() });
});

// Test endpoint for monitoring scripts
router.get('/test', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const socketService = require('../services/SocketService');
    
    // Check various service statuses
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        socketIO: socketService.isInitialized ? 'initialized' : 'not_initialized',
        sharp: (() => {
          try {
            const sharp = require('sharp');
            const testBuffer = Buffer.alloc(100);
            sharp(testBuffer);
            return 'working';
          } catch (error) {
            return 'fallback_mode';
          }
        })()
      },
      memory: {
        used: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
