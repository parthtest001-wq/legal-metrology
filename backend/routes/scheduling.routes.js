// /backend/routes/scheduling.routes.js
// Owned by Module 3. Mounted at /api/v1/scheduling in routes/index.js (additively).

const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../../shared/constants');
const schedulingController = require('../controllers/scheduling.controller');

// PATCH /api/v1/scheduling/applications/:id/assign — gatc, admin
router.patch(
  '/applications/:id/assign',
  authenticate,
  authorize(ROLES.GATC, ROLES.ADMIN),
  schedulingController.assignApplication
);

// GET /api/v1/scheduling/lmo/:lmoId/queue — lmo (self), admin
router.get(
  '/lmo/:lmoId/queue',
  authenticate,
  authorize(ROLES.LMO, ROLES.ADMIN),
  schedulingController.getLmoQueue
);

// PATCH /api/v1/scheduling/applications/:id/status — lmo, gatc, admin
router.patch(
  '/applications/:id/status',
  authenticate,
  authorize(ROLES.LMO, ROLES.GATC, ROLES.ADMIN),
  schedulingController.updateApplicationStatus
);

module.exports = router;
