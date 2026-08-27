// /backend/routes/verification.routes.js
// Owned by Module 3. Mounted at /api/v1/verification in routes/index.js (additively).

const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadVerificationPhotos } = require('../middleware/upload.middleware'); // owned by Module 2, imported read-only
const { ROLES } = require('../../shared/constants');
const verificationController = require('../controllers/verification.controller');

// POST /api/v1/verification/:applicationId — lmo only, multipart photos
// MERGE FIX: originally called `upload.array('photos', 10)` directly on the
// upload.middleware.js module export, which has no `.array()` method (see
// upload.middleware.js merge-fix comment) and crashed the server at boot.
// Now uses the uploadVerificationPhotos middleware added to Module 2's
// upload.middleware.js during merge specifically for this route.
router.post(
  '/:applicationId',
  authenticate,
  authorize(ROLES.LMO),
  uploadVerificationPhotos,
  verificationController.recordVerification
);

// GET /api/v1/verification/:applicationId — consumer (own), lmo, gatc, admin
router.get(
  '/:applicationId',
  authenticate,
  authorize(ROLES.CONSUMER, ROLES.LMO, ROLES.GATC, ROLES.ADMIN),
  verificationController.getVerification
);

module.exports = router;
