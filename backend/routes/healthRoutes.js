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

module.exports = router;
