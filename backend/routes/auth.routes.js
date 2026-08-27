const express = require('express');
const { register, login, me, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');

const router = express.Router();

// POST /api/v1/auth/register — public
router.post(
  '/register',
  validateBody({
    name: ['required'],
    email: ['required', 'email'],
    phone: ['required', 'phone'],
    password: ['required', ['minLength', 8]],
    role: ['required'],
    state: ['required'],
    district: ['required'],
  }),
  register
);

// POST /api/v1/auth/login — public
router.post(
  '/login',
  validateBody({
    email: ['required', 'email'],
    password: ['required'],
  }),
  login
);

// GET /api/v1/auth/me — any authenticated
router.get('/me', authenticate, me);

// --- Extensions beyond Section 4's table (see auth.controller.js notes) ---
router.post('/forgot-password', validateBody({ email: ['required', 'email'] }), forgotPassword);
router.post(
  '/reset-password',
  validateBody({
    email: ['required', 'email'],
    token: ['required'],
    newPassword: ['required', ['minLength', 8]],
  }),
  resetPassword
);

module.exports = router;
