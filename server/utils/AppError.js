class AppError extends Error {
  constructor(errorCode, message, statusCode) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode || 500;
    this.isOperational = true; // To distinguish from unhandled programming exceptions
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
