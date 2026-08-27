/**
 * alert.routes.js
 * Owned by: Module 5
 *
 * Mounted in /backend/routes/index.js as:
 *   router.use('/alerts', require('./alert.routes'));
 * (index.js is edited additively by each module — never overwritten, per
 * Section 10 of the Master Spec.)
 *
 * Imports the shared auth middleware from its canonical path — does not
 * reimplement JWT verification (Section 6).
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const alertController = require('../controllers/alert.controller');

// GET /api/v1/alerts — any authenticated user, own notifications
router.get('/', authenticate, alertController.getAlerts);

// PATCH /api/v1/alerts/:id/read — owner only
router.patch('/:id/read', authenticate, alertController.markAsRead);

// GET /api/v1/alerts/expiring-certificates — admin, gatc
router.get(
  '/expiring-certificates',
  authenticate,
  authorize('admin', 'gatc'),
  alertController.getExpiringCertificates
);

// POST /api/v1/alerts/trigger-check — admin (manual trigger; also runs on cron)
router.post('/trigger-check', authenticate, authorize('admin'), alertController.triggerCheck);

// --- Extension beyond frozen Section 4 table (see alert.controller.js header) ---
// GET /api/v1/alerts/preferences — any authenticated user, own preferences
router.get('/preferences', authenticate, alertController.getPreferences);

// PUT /api/v1/alerts/preferences — any authenticated user, own preferences
router.put('/preferences', authenticate, alertController.updatePreferences);

module.exports = router;
