const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const response = {
    success: false,
    error: error.message,
    ...(env.NODE_ENV === 'development' && { stack: error.stack })
  };

  // Log unexpected errors
  if (!error.isOperational) {
    console.error('🔥 Unexpected Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorMiddleware;
