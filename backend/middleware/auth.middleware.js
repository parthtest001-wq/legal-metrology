// /backend/middleware/auth.middleware.js
// Every protected route in every module imports these two functions from this
// exact path. No module writes its own JWT verification logic.

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { error: sendError } = require('../utils/apiResponse');

// Verifies JWT, attaches req.user = { id, role, name }
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 'Authentication token missing', 401, 'AUTH_REQUIRED');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role, name: payload.name };
    return next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401, 'AUTH_INVALID');
  }
}

// Usage: router.get('/x', authenticate, authorize('admin', 'gatc'), controllerFn)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403, 'FORBIDDEN');
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
