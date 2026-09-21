/**
 * Centralized error handling middleware
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ [${req.method}] ${req.originalUrl}:`, err.message);
    if (err.stack) console.error(err.stack);
  } else {
    console.error(`❌ [${req.method}] ${req.originalUrl}: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Async route wrapper to catch errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { AppError, errorHandler, notFoundHandler, asyncHandler };
