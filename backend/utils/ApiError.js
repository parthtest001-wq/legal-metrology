// /backend/utils/ApiError.js
// Lightweight error class controllers can throw / pass to next(err).
// Not a model, not a route — a plain utility any module may reuse.

class ApiError extends Error {
  constructor(message, statusCode = 400, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = ApiError;
