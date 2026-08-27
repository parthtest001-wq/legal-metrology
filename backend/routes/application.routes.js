// /backend/routes/application.routes.js
// Owned by Module 2. Mounted at /api/v1/applications (see routes/index.js).

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadApplicationDocuments } = require('../middleware/upload.middleware');
const { ROLES } = require('../../shared/constants');
const applicationController = require('../controllers/application.controller');

const router = express.Router();

// POST /api/v1/applications — consumer
router.post(
  '/',
  authenticate,
  authorize(ROLES.CONSUMER),
  uploadApplicationDocuments,
  applicationController.createApplication
);

// GET /api/v1/applications — consumer (own), lmo (assigned), gatc (own center), admin (all)
router.get(
  '/',
  authenticate,
  authorize(ROLES.CONSUMER, ROLES.LMO, ROLES.GATC, ROLES.ADMIN),
  applicationController.listApplications
);

// GET /api/v1/applications/:id
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.CONSUMER, ROLES.LMO, ROLES.GATC, ROLES.ADMIN),
  applicationController.getApplication
);

// PATCH /api/v1/applications/:id/cancel — consumer (own, if submitted)
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(ROLES.CONSUMER),
  applicationController.cancelApplication
);

// PATCH /api/v1/applications/:id/edit — EXTENSION, not in frozen Section 4
// contract table. Owned by Module 2, additive only. See DELIVERABLES.md.
router.patch(
  '/:id/edit',
  authenticate,
  authorize(ROLES.CONSUMER),
  uploadApplicationDocuments,
  applicationController.editApplication
);

module.exports = router;
