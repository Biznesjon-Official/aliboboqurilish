const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    status,
    message,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
