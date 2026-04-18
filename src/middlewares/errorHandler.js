class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error.';

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ObjectId format.';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue || {})[0] || 'field';
    statusCode = 409;
    message = `${duplicateField} must be unique.`;
  }

  res.status(statusCode).json({
    error: true,
    message,
    status: statusCode
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler
};
