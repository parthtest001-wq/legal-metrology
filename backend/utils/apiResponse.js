// /backend/utils/apiResponse.js
// Standard response envelope (Master Spec Section 5). Every controller in every
// module uses these two helpers — no module writes its own res.json() formatting.

exports.success = (res, data, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message, error: null });

exports.error = (res, message, statusCode = 400, code = 'ERROR', details = null) =>
  res.status(statusCode).json({ success: false, data: null, message, error: { code, details } });
