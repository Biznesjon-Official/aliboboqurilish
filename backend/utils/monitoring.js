const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0
    };
  }

  recordRequest(duration, error = false) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.requests;
    
    if (error) {
      this.metrics.errors++;
    }

    if (this.metrics.requests % 100 === 0) {
      this.logMetrics();
    }
  }

  logMetrics() {
    const errorRate = ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2);
    logger.info('Performance metrics', {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: `${errorRate}%`,
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`
    });
  }

  getMetrics() {
    return this.metrics;
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0
    };
  }
}

const monitor = new PerformanceMonitor();

const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const error = res.statusCode >= 400;
    monitor.recordRequest(duration, error);

    if (error) {
      logger.warn('Request error', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

module.exports = {
  monitor,
  monitoringMiddleware
};
