// /backend/middleware/error.middleware.js
// Single centralized error handler, registered LAST in server.js.
// Controllers call next(err) on failure instead of formatting their own responses.

const { error: sendError } = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('[error]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      issue: e.message,
    }));
    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(
      res,
      'Duplicate value',
      409,
      'DUPLICATE_KEY',
      [{ field, issue: 'already registered' }]
    );
  }

  // Mongoose cast error (bad ObjectId etc.)
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid identifier', 400, 'CAST_ERROR', [
      { field: err.path, issue: 'invalid value' },
    ]);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired token', 401, 'AUTH_ERROR');
  }

  // Our own thrown ApiError (has statusCode/code)
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  return sendError(res, message, statusCode, code, err.details || null);
}

module.exports = errorMiddleware;
