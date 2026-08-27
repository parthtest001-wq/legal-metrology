// /backend/middleware/validate.middleware.js
// Generic request-body validator. Each module defines its own rule set and
// passes it to `validateBody(rules)`; this file owns only the generic engine.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts optional +91 / 0 prefix followed by a 10-digit Indian mobile number.
const PHONE_REGEX = /^(\+91[-\s]?|0)?[6-9]\d{9}$/;

const validators = {
  required: (value) => value !== undefined && value !== null && String(value).trim() !== '',
  email: (value) => EMAIL_REGEX.test(String(value || '')),
  phone: (value) => PHONE_REGEX.test(String(value || '')),
  minLength: (value, len) => String(value || '').length >= len,
};

/**
 * validateBody({
 *   email: ['required', 'email'],
 *   phone: ['required', 'phone'],
 *   password: ['required', ['minLength', 8]],
 * })
 */
function validateBody(rules) {
  return (req, res, next) => {
    const details = [];

    Object.entries(rules).forEach(([field, fieldRules]) => {
      fieldRules.forEach((rule) => {
        const [ruleName, arg] = Array.isArray(rule) ? rule : [rule];
        const fn = validators[ruleName];
        if (!fn) return;
        const value = req.body[field];
        const ok = arg !== undefined ? fn(value, arg) : fn(value);
        if (!ok) {
          details.push({ field, issue: `failed rule: ${ruleName}${arg ? `(${arg})` : ''}` });
        }
      });
    });

    if (details.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation failed',
        error: { code: 'VALIDATION_ERROR', details },
      });
    }

    return next();
  };
}

module.exports = { validateBody, EMAIL_REGEX, PHONE_REGEX };
