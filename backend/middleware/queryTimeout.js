/**
 * Query Timeout Middleware
 * Prevents long-running database queries from blocking the application
 */

const mongoose = require('mongoose');

// Default timeout values (in milliseconds)
const DEFAULT_QUERY_TIMEOUT = 5000;  // 5 seconds
const SLOW_QUERY_THRESHOLD = 1000;   // 1 second

/**
 * Middleware to add timeout to all mongoose queries
 */
const queryTimeoutMiddleware = (timeout = DEFAULT_QUERY_TIMEOUT) => {
  return (req, res, next) => {
    // Store original query methods
    const originalFind = mongoose.Query.prototype.exec;
    
    // Override exec method to add timeout
    mongoose.Query.prototype.exec = function(callback) {
      // Add timeout to this query
      this.maxTimeMS(timeout);
      
      // Track query performance
      const startTime = Date.now();
      const queryType = this.op;
      const modelName = this.model?.modelName || 'Unknown';
      
      // Execute original query
      const result = originalFind.call(this, callback);
      
      // If it's a promise, add performance tracking
      if (result && typeof result.then === 'function') {
        return result
          .then(data => {
            const duration = Date.now() - startTime;
            
            // Log slow queries in development
            if (process.env.NODE_ENV === 'development' && duration > SLOW_QUERY_THRESHOLD) {
              console.log(`🐌 Slow query detected: ${modelName}.${queryType} took ${duration}ms`);
            }
            
            return data;
          })
          .catch(error => {
            const duration = Date.now() - startTime;
            
            // Handle timeout errors specifically
            if (error.name === 'MongoNetworkTimeoutError' || 
                error.message.includes('timed out') ||
                error.message.includes('maxTimeMS')) {
              console.error(`⏰ Query timeout: ${modelName}.${queryType} exceeded ${timeout}ms`);
              
              // Create a more user-friendly error
              const timeoutError = new Error('Database query timeout - please try again');
              timeoutError.name = 'QueryTimeoutError';
              timeoutError.statusCode = 503;
              timeoutError.retryAfter = 5;
              throw timeoutError;
            }
            
            console.error(`❌ Query error: ${modelName}.${queryType} failed after ${duration}ms:`, error.message);
            throw error;
          });
      }
      
      return result;
    };
    
    next();
  };
};

/**
 * Express error handler for query timeouts
 */
const handleQueryTimeout = (error, req, res, next) => {
  if (error.name === 'QueryTimeoutError' || 
      error.name === 'MongoNetworkTimeoutError' ||
      error.message.includes('maxTimeMS')) {
    
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'The request is taking too long to process. Please try again in a few moments.',
      code: 'QUERY_TIMEOUT',
      retryAfter: error.retryAfter || 5
    });
  }
  
  next(error);
};

/**
 * Performance monitoring for database operations
 */
const performanceMonitor = {
  slowQueries: [],
  maxSlowQueries: 100,
  
  recordSlowQuery(modelName, operation, duration, query) {
    const record = {
      timestamp: new Date(),
      model: modelName,
      operation,
      duration,
      query: JSON.stringify(query).substring(0, 200) // Truncate long queries
    };
    
    this.slowQueries.push(record);
    
    // Keep only the most recent slow queries
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries.shift();
    }
  },
  
  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  },
  
  getAverageQueryTime() {
    if (this.slowQueries.length === 0) return 0;
    
    const total = this.slowQueries.reduce((sum, query) => sum + query.duration, 0);
    return Math.round(total / this.slowQueries.length);
  }
};

module.exports = {
  queryTimeoutMiddleware,
  handleQueryTimeout,
  performanceMonitor,
  DEFAULT_QUERY_TIMEOUT,
  SLOW_QUERY_THRESHOLD
};