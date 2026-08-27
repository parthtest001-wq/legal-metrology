/**
 * Module 6 — /backend/routes/dashboard.routes.js
 * Mounted at /api/v1/dashboard by routes/index.js (Section 4).
 * Imports the shared auth middleware — does not reimplement JWT checks.
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getConsumerDashboard,
  getLmoDashboard,
  getGatcDashboard,
  getAdminDashboard,
} = require('../controllers/dashboard.controller');

router.get('/consumer', authenticate, authorize('consumer'), getConsumerDashboard);
router.get('/lmo', authenticate, authorize('lmo'), getLmoDashboard);
router.get('/gatc', authenticate, authorize('gatc'), getGatcDashboard);
router.get('/admin', authenticate, authorize('admin'), getAdminDashboard);

module.exports = router;
