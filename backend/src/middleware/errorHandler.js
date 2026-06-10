import ApiError from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) console.error(err);

  const body = {
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    errors: err.errors || [],
  };

  res.status(statusCode).json(body);
}
